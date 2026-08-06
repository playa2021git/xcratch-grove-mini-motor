const EXTENSION_ID = 'groveMiniMotor';
const EXTENSION_NAME = 'Groveミニモーター';
const EXTENSION_DESCRIPTION = 'TFW-TR1からGrove Mini I2C Motor Driverを制御します';
let extensionURL = 'grove-mini-motor.mjs';

const iconURL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='18' fill='%2300A67E'/%3E%3Ccircle cx='40' cy='40' r='20' fill='white'/%3E%3Ccircle cx='40' cy='40' r='8' fill='%2300A67E'/%3E%3Cpath d='M40 10v12M40 58v12M10 40h12M58 40h12' stroke='white' stroke-width='6' stroke-linecap='round'/%3E%3C/svg%3E";

const entry = {
  name: EXTENSION_NAME,
  extensionId: EXTENSION_ID,
  extensionURL,
  collaborator: 'playa2021git',
  iconURL,
  insetIconURL: iconURL,
  description: EXTENSION_DESCRIPTION,
  tags: ['hardware', 'motor', 'akadako', 'grove'],
  featured: true,
  disabled: false,
  bluetoothRequired: false,
  internetConnectionRequired: false
};

const CONTROL_REGISTER = 0x00;
const FAULT_REGISTER = 0x01;
const CLEAR_FAULT = 0x80;

const MODE = Object.freeze({
  COAST: 0x00,
  REVERSE: 0x01,
  FORWARD: 0x02,
  BRAKE: 0x03
});

const CHANNEL_ADDRESS = Object.freeze({
  Ch1: 0x65,
  Ch2: 0x60
});

class ExtensionBlocks {
  constructor(runtime) {
    this.runtime = runtime;
  }

  getInfo() {
    return {
      id: EXTENSION_ID,
      name: EXTENSION_NAME,
      extensionURL,
      blockIconURI: iconURL,
      showStatusButton: false,
      color1: '#00A67E',
      color2: '#008F6C',
      color3: '#00785B',
      blocks: [
        {
          opcode: 'drive',
          blockType: 'command',
          blockAllThreads: false,
          text: 'モーター [CHANNEL] を [DIRECTION] に 速度 [SPEED] で回す',
          func: 'drive',
          arguments: {
            CHANNEL: {
              type: 'string',
              menu: 'channelMenu',
              defaultValue: 'Ch2'
            },
            DIRECTION: {
              type: 'string',
              menu: 'directionMenu',
              defaultValue: '正転'
            },
            SPEED: {
              type: 'number',
              defaultValue: 10
            }
          }
        },
        {
          opcode: 'stop',
          blockType: 'command',
          blockAllThreads: false,
          text: 'モーター [CHANNEL] を惰性で止める',
          func: 'stop',
          arguments: {
            CHANNEL: {
              type: 'string',
              menu: 'channelMenu',
              defaultValue: 'Ch2'
            }
          }
        },
        {
          opcode: 'brake',
          blockType: 'command',
          blockAllThreads: false,
          text: 'モーター [CHANNEL] をブレーキで止める',
          func: 'brake',
          arguments: {
            CHANNEL: {
              type: 'string',
              menu: 'channelMenu',
              defaultValue: 'Ch2'
            }
          }
        },
        {
          opcode: 'clearFault',
          blockType: 'command',
          blockAllThreads: false,
          text: 'モーター [CHANNEL] の fault を解除する',
          func: 'clearFault',
          arguments: {
            CHANNEL: {
              type: 'string',
              menu: 'channelMenu',
              defaultValue: 'Ch2'
            }
          }
        },
        {
          opcode: 'commandValue',
          blockType: 'reporter',
          blockAllThreads: false,
          text: '[DIRECTION] 速度 [SPEED] の制御値',
          func: 'commandValue',
          arguments: {
            DIRECTION: {
              type: 'string',
              menu: 'directionMenu',
              defaultValue: '正転'
            },
            SPEED: {
              type: 'number',
              defaultValue: 10
            }
          }
        }
      ],
      menus: {
        channelMenu: {
          acceptReporters: false,
          items: ['Ch1', 'Ch2']
        },
        directionMenu: {
          acceptReporters: false,
          items: ['正転', '逆転']
        }
      }
    };
  }

  getAddress(channel) {
    const name = String(channel).trim();
    const address = CHANNEL_ADDRESS[name];
    if (typeof address !== 'number') {
      throw new Error(`不正なチャンネルです: ${name}`);
    }
    return address;
  }

  clampSpeed(value) {
    const speed = Math.round(Number(value));
    if (!Number.isFinite(speed)) return 0;
    return Math.max(0, Math.min(63, speed));
  }

  getI2CWriter() {
    const primitive = this.runtime && this.runtime._primitives && this.runtime._primitives.g2s_i2cWrite;
    if (typeof primitive !== 'function') {
      throw new Error('AkaDako拡張が見つかりません。先にAkaDako拡張を追加してください。');
    }
    return primitive;
  }

  write(address, register, data) {
    const i2cWrite = this.getI2CWriter();
    return i2cWrite({
      ADDRESS: address,
      REGISTER: register,
      DATA: String(data)
    });
  }

  async drive(args) {
    const address = this.getAddress(args.CHANNEL);
    const speed = this.clampSpeed(args.SPEED);

    if (speed === 0) {
      await this.write(address, CONTROL_REGISTER, MODE.COAST);
      return;
    }

    const mode = args.DIRECTION === '逆転' ? MODE.REVERSE : MODE.FORWARD;
    const command = (speed << 2) | mode;

    await this.write(address, FAULT_REGISTER, CLEAR_FAULT);
    await this.write(address, CONTROL_REGISTER, command);
  }

  stop(args) {
    const address = this.getAddress(args.CHANNEL);
    return this.write(address, CONTROL_REGISTER, MODE.COAST);
  }

  brake(args) {
    const address = this.getAddress(args.CHANNEL);
    return this.write(address, CONTROL_REGISTER, MODE.BRAKE);
  }

  clearFault(args) {
    const address = this.getAddress(args.CHANNEL);
    return this.write(address, FAULT_REGISTER, CLEAR_FAULT);
  }

  commandValue(args) {
    const speed = this.clampSpeed(args.SPEED);
    if (speed === 0) return 0;
    const mode = args.DIRECTION === '逆転' ? MODE.REVERSE : MODE.FORWARD;
    return (speed << 2) | mode;
  }

  static get EXTENSION_ID() {
    return EXTENSION_ID;
  }

  static get EXTENSION_NAME() {
    return EXTENSION_NAME;
  }

  static get extensionURL() {
    return extensionURL;
  }

  static set extensionURL(url) {
    extensionURL = url;
    entry.extensionURL = url;
  }
}

export {ExtensionBlocks as blockClass, entry};
