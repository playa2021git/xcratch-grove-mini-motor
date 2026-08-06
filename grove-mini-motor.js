/*
 * Grove Mini I2C Motor Driver 専用 Xcratch 拡張
 *
 * 対応機器:
 * - TFW-TR1（タコラッチ）
 * - Grove Mini I2C Motor Driver（DRV8830）
 *
 * この拡張はAkaDako拡張のI2C書き込み機能を利用します。
 */

(function (Scratch) {
    'use strict';

    const CONTROL_REGISTER = 0x00;
    const FAULT_REGISTER = 0x01;
    const CLEAR_FAULT = 0x80;

    const MODE = Object.freeze({
        COAST: 0b00,
        REVERSE: 0b01,
        FORWARD: 0b10,
        BRAKE: 0b11
    });

    class GroveMiniMotor {
        getInfo() {
            return {
                id: 'groveminimotor',
                name: 'Groveミニモーター',
                color1: '#00A67E',
                color2: '#008F6C',
                color3: '#00785B',
                blocks: [
                    {
                        opcode: 'drive',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'モーター [ADDRESS] を [DIRECTION] に 速度 [SPEED] で回す',
                        arguments: {
                            ADDRESS: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'addressMenu',
                                defaultValue: '0x60'
                            },
                            DIRECTION: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'directionMenu',
                                defaultValue: 'forward'
                            },
                            SPEED: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 10
                            }
                        }
                    },
                    {
                        opcode: 'stop',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'モーター [ADDRESS] を惰性で止める',
                        arguments: {
                            ADDRESS: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'addressMenu',
                                defaultValue: '0x60'
                            }
                        }
                    },
                    {
                        opcode: 'brake',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'モーター [ADDRESS] をブレーキで止める',
                        arguments: {
                            ADDRESS: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'addressMenu',
                                defaultValue: '0x60'
                            }
                        }
                    },
                    {
                        opcode: 'clearFault',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'モーター [ADDRESS] のfaultを解除する',
                        arguments: {
                            ADDRESS: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'addressMenu',
                                defaultValue: '0x60'
                            }
                        }
                    },
                    {
                        opcode: 'commandValue',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '[DIRECTION] 速度 [SPEED] の制御値',
                        arguments: {
                            DIRECTION: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'directionMenu',
                                defaultValue: 'forward'
                            },
                            SPEED: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 10
                            }
                        },
                        disableMonitor: true
                    }
                ],
                menus: {
                    addressMenu: {
                        acceptReporters: true,
                        items: [
                            {text: '0x60', value: '0x60'},
                            {text: '0x62', value: '0x62'}
                        ]
                    },
                    directionMenu: {
                        acceptReporters: true,
                        items: [
                            {text: '正転', value: 'forward'},
                            {text: '逆転', value: 'reverse'}
                        ]
                    }
                }
            };
        }

        getRuntime() {
            const runtime = Scratch.vm && Scratch.vm.runtime;
            if (!runtime) {
                throw new Error(
                    'XcratchのVMへアクセスできません。拡張機能をサンドボックス外で読み込んでください。'
                );
            }
            return runtime;
        }

        getI2CWriter() {
            const runtime = this.getRuntime();
            const writer = runtime._primitives && runtime._primitives.g2s_i2cWrite;
            if (typeof writer !== 'function') {
                throw new Error(
                    'AkaDako拡張が見つかりません。先にAkaDako拡張を追加し、TFW-TR1を接続してください。'
                );
            }
            return writer;
        }

        parseAddress(value) {
            const text = String(value).trim();
            const address = Number(text);
            if (!Number.isInteger(address) || address < 0 || address > 0x7F) {
                throw new Error(`I2Cアドレスが不正です: ${text}`);
            }
            return address;
        }

        clampSpeed(value) {
            const speed = Math.round(Number(value));
            if (!Number.isFinite(speed)) return 0;
            return Math.max(0, Math.min(63, speed));
        }

        async write(address, register, data) {
            const writer = this.getI2CWriter();
            await writer({
                ADDRESS: address,
                REGISTER: register,
                DATA: String(data)
            });
        }

        async drive(args) {
            const address = this.parseAddress(args.ADDRESS);
            const speed = this.clampSpeed(args.SPEED);

            if (speed === 0) {
                await this.write(address, CONTROL_REGISTER, MODE.COAST);
                return;
            }

            const mode = args.DIRECTION === 'reverse' ? MODE.REVERSE : MODE.FORWARD;
            const command = (speed << 2) | mode;

            await this.write(address, FAULT_REGISTER, CLEAR_FAULT);
            await this.write(address, CONTROL_REGISTER, command);
        }

        async stop(args) {
            const address = this.parseAddress(args.ADDRESS);
            await this.write(address, CONTROL_REGISTER, MODE.COAST);
        }

        async brake(args) {
            const address = this.parseAddress(args.ADDRESS);
            await this.write(address, CONTROL_REGISTER, MODE.BRAKE);
        }

        async clearFault(args) {
            const address = this.parseAddress(args.ADDRESS);
            await this.write(address, FAULT_REGISTER, CLEAR_FAULT);
        }

        commandValue(args) {
            const speed = this.clampSpeed(args.SPEED);
            if (speed === 0) return 0;
            const mode = args.DIRECTION === 'reverse' ? MODE.REVERSE : MODE.FORWARD;
            return (speed << 2) | mode;
        }
    }

    Scratch.extensions.register(new GroveMiniMotor());
})(Scratch);
