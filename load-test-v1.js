/*
 * Xcratch拡張ローダーの切り分け用テスト
 * モーターやAkaDakoにはアクセスしません。
 */
(function (Scratch) {
    'use strict';

    class GroveMotorLoadTest {
        getInfo () {
            return {
                id: 'grovemotorloadtest1',
                name: 'Grove Motor 読込テスト',
                color1: '#00A67E',
                blocks: [
                    {
                        opcode: 'status',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '拡張の読込状態'
                    }
                ]
            };
        }

        status () {
            return 'OK: load-test-v1';
        }
    }

    Scratch.extensions.register(new GroveMotorLoadTest());
})(Scratch);
