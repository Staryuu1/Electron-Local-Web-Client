const fs = require('fs');
const path = require('path');

let currentLanguage = 'indonesia';
let translations = {};


function loadLanguage(lang = 'indonesia') {
  try {
    const langPath = path.join(__dirname, `${lang}.json`);
    if (!fs.existsSync(langPath)) {
      console.error(`Language file not found: ${langPath}`);
      return false;
    }
    
    const data = fs.readFileSync(langPath, 'utf8');
    translations = JSON.parse(data);
    currentLanguage = lang;
    console.log(`Language loaded: ${lang}`);
    return true;
  } catch (error) {
    console.error('Error loading language file:', error);
    return false;
  }
}


function t(key) {
  if (!key) {
    console.warn('Translation key is empty');
    return '';
  }

  const keys = key.split('.');
  let value = translations;
  for (const k of keys) {
    if (value[k] === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    value = value[k];
  }
  
  return value;
}


function setLanguage(lang) {
  if (lang === currentLanguage) {
    return true;
  }
  return loadLanguage(lang);
}


function getCurrentLanguage() {
  return currentLanguage;
}


function getAvailableLanguages() {
  try {
    const files = fs.readdirSync(__dirname);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  } catch (error) {
    console.error('Error getting available languages:', error);
    return [];
  }
}


if (!loadLanguage()) {
  console.error('Failed to load default language');
}

module.exports = {
  t,
  setLanguage,
  getCurrentLanguage,
  getAvailableLanguages,
  loadLanguage
}; 