/*
 * Grove Mini I2C Motor Driver 専用 Xcratch 拡張
 * Version: 1.1.3 isolated test build
 *
 * チャンネルとI2Cアドレス
 * - Ch1: 0x65
 * - Ch2: 0x60
 *
 * 旧版とのキャッシュ衝突と二重登録を避けるため、
 * ファイル名と拡張IDを新しくしています。
 */
(function (Scratch) {
    'use strict';

    var CONTROL_REGISTER = 0x00;
    var FAULT_REGISTER = 0x01;
    var CLEAR_FAULT = 0x80;

    var MODE_COAST = 0x00;
    var MODE_REVERSE = 0x01;
    var MODE_FORWARD = 0x02;
    var MODE_BRAKE = 0x03;

    class GroveMiniMotorV113 {
        getInfo () {
            return {
                id: 'groveminimotorv113',
                name: 'Groveミニモーター v1.1.3',
                color1: '#00A67E',
                color2: '#008F6C',
                color3: '#00785B',
                blocks: [
                    {
                        opcode: 'drive',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'モーター [CHANNEL] を [DIRECTION] に 速度 [SPEED] で回す',
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'channelMenu',
                                defaultValue: 'Ch2'
                            },
                            DIRECTION: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'directionMenu',
                                defaultValue: '正転'
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
                        text: 'モーター [CHANNEL] を惰性で止める',
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'channelMenu',
                                defaultValue: 'Ch2'
                            }
                        }
                    },
                    {
                        opcode: 'brake',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'モーター [CHANNEL] をブレーキで止める',
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'channelMenu',
                                defaultValue: 'Ch2'
                            }
                        }
                    },
                    {
                        opcode: 'clearFault',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'モーター [CHANNEL] のfaultを解除する',
                        arguments: {
                            CHANNEL: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'channelMenu',
                                defaultValue: 'Ch2'
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
                                defaultValue: '正転'
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
                    channelMenu: {
                        acceptReporters: true,
                        items: ['Ch1', 'Ch2']
                    },
                    directionMenu: {
                        acceptReporters: true,
                        items: ['正転', '逆転']
                    }
                }
            };
        }

        getRuntime () {
            var runtime = Scratch.vm && Scratch.vm.runtime;
            if (!runtime) {
                throw new Error('XcratchのVMへアクセスできません。Xcratch正式形式の拡張が必要です。');
            }
            return runtime;
        }

        getI2CWriter () {
            var runtime = this.getRuntime();
            var writer = runtime._primitives && runtime._primitives.g2s_i2cWrite;
            if (typeof writer !== 'function') {
                throw new Error('AkaDako拡張が見つかりません。先にAkaDako拡張を追加してください。');
            }
            return writer;
        }

        getAddress (channel) {
            var value = String(channel).trim();
            if (value === 'Ch1') return 0x65;
            if (value === 'Ch2') return 0x60;
            throw new Error('不正なチャンネルです: ' + value);
        }

        clampSpeed (value) {
            var speed = Math.round(Number(value));
            if (!Number.isFinite(speed)) return 0;
            return Math.max(0, Math.min(63, speed));
        }

        write (address, register, data) {
            var writer = this.getI2CWriter();
            return writer({
                ADDRESS: address,
                REGISTER: register,
                DATA: String(data)
            });
        }

        async drive (args) {
            var address = this.getAddress(args.CHANNEL);
            var speed = this.clampSpeed(args.SPEED);

            if (speed === 0) {
                await this.write(address, CONTROL_REGISTER, MODE_COAST);
                return;
            }

            var mode = args.DIRECTION === '逆転' ? MODE_REVERSE : MODE_FORWARD;
            var command = (speed << 2) | mode;

            await this.write(address, FAULT_REGISTER, CLEAR_FAULT);
            await this.write(address, CONTROL_REGISTER, command);
        }

        async stop (args) {
            var address = this.getAddress(args.CHANNEL);
            await this.write(address, CONTROL_REGISTER, MODE_COAST);
        }

        async brake (args) {
            var address = this.getAddress(args.CHANNEL);
            await this.write(address, CONTROL_REGISTER, MODE_BRAKE);
        }

        async clearFault (args) {
            var address = this.getAddress(args.CHANNEL);
            await this.write(address, FAULT_REGISTER, CLEAR_FAULT);
        }

        commandValue (args) {
            var speed = this.clampSpeed(args.SPEED);
            if (speed === 0) return 0;
            var mode = args.DIRECTION === '逆転' ? MODE_REVERSE : MODE_FORWARD;
            return (speed << 2) | mode;
        }
    }

    Scratch.extensions.register(new GroveMiniMotorV113());
})(Scratch);
