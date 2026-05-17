import fs from 'fs';

const patches = [
  {
    file: 'src/home.jsx',
    header: `import React from 'react';
import { SnapAPI } from './api/client';
import { Snap, SnapWordmark, Avatar, I, Phone, Dock } from './mascot';

`,
    footer: '\nexport { HomeScreen, ChatMessage, aiReply };\n',
    exportFns: ['HomeScreen', 'ChatMessage', 'aiReply'],
  },
  {
    file: 'src/screens-auth.jsx',
    header: `import React from 'react';
import { SnapAPI, showToast } from './api/client';
import { Snap, Avatar, AppBar, I } from './mascot';

`,
    footer: '\nexport { LoginScreen, NotificationsScreen };\n',
    exportFns: ['LoginScreen', 'NotificationsScreen'],
  },
  {
    file: 'src/screens-capture.jsx',
    header: `import React from 'react';
import { SnapAPI, showToast } from './api/client';
import { Avatar, AppBar, I } from './mascot';

`,
    footer: '\nexport { ScanScreen, MileageScreen };\n',
    exportFns: ['ScanScreen', 'MileageScreen'],
  },
  {
    file: 'src/screens-tax.jsx',
    header: `import React from 'react';
import { SnapAPI, showToast } from './api/client';
import { Avatar, AppBar, I } from './mascot';
import { ChatMessage } from './home';

`,
    footer: '\nexport { ExpensesScreen, ProfileScreen, TaxesScreen, ExportScreen, AskScreen };\n',
    exportFns: ['ExpensesScreen', 'ProfileScreen', 'TaxesScreen', 'ExportScreen', 'AskScreen'],
  },
  {
    file: 'src/design-canvas.jsx',
    header: `import React from 'react';

`,
    footer: '\nexport { DesignCanvas, DCSection, DCArtboard, DCPostIt };\n',
    exportFns: ['DesignCanvas', 'DCSection', 'DCArtboard', 'DCPostIt'],
  },
  {
    file: 'src/tweaks-panel.jsx',
    header: `import React from 'react';

`,
    footer: `\nexport {
  useTweaks, TweaksPanel, TweakSection, TweakRow,
  TweakSlider, TweakToggle, TweakRadio, TweakSelect,
  TweakText, TweakNumber, TweakColor, TweakButton,
};\n`,
    exportFns: [
      'useTweaks', 'TweaksPanel', 'TweakSection', 'TweakRow',
      'TweakSlider', 'TweakToggle', 'TweakRadio', 'TweakSelect',
      'TweakText', 'TweakNumber', 'TweakColor', 'TweakButton',
    ],
  },
];

for (const { file, header, footer, exportFns } of patches) {
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace(/Object\.assign\(window[\s\S]*?\);\s*/g, '');
  if (!text.startsWith('import')) {
    text = text.replace(/^\/\/[^\n]*\n(\/\/[^\n]*\n)*/m, '');
    text = header + text;
  }
  for (const name of exportFns) {
    text = text.replace(new RegExp(`^function ${name}\\b`, 'm'), `export function ${name}`);
  }
  if (!text.includes(footer.trim())) text = text.trimEnd() + footer;
  fs.writeFileSync(file, text);
  console.log('patched', file);
}
