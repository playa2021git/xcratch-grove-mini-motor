const EXTENSION_ID = 'groveMotorLoadTest';
const EXTENSION_NAME = 'Grove Motor 読込テスト';
let extensionURL = 'load-test.mjs';

const iconURL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='18' fill='%2357c957'/%3E%3Cpath d='M22 41l12 12 25-27' fill='none' stroke='white' stroke-width='9' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

const entry = {
  name: EXTENSION_NAME,
  extensionId: EXTENSION_ID,
  extensionURL,
  collaborator: 'playa2021git',
  iconURL,
  insetIconURL: iconURL,
  description: 'Xcratch正式形式の読込確認',
  tags: ['test'],
  featured: true,
  disabled: false,
  bluetoothRequired: false,
  internetConnectionRequired: false
};

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
      blocks: [
        {
          opcode: 'status',
          blockType: 'reporter',
          blockAllThreads: false,
          text: '拡張の読込状態',
          func: 'status'
        }
      ],
      menus: {}
    };
  }

  status() {
    return 'OK: Xcratch native mjs';
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
