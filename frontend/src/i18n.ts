import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback } from 'react';

export type Lang = 'en' | 'hi' | 'ta';

type Dict = Record<string, string>;

const en: Dict = {
  appName: 'A Gentle Guide',
  landingSub: "We'll walk you through it, one step at a time.",
  startButton: 'Start — I need help right now',
  continueLink: 'Continue where I left off',
  next: 'Next',
  skip: 'Skip / Prefer not to say',
  back: 'Back',
  step: 'Step',

  locationTitle: 'Where are you?',
  locationHelp: 'This helps us show services close by. You can change it later.',
  locationPlaceholder: 'City or area',
  useMyLocation: 'Use my current location',
  detecting: 'Detecting…',

  placeTitle: 'Where did they pass away?',
  placeHospital: 'In a hospital',
  placeHome: 'At home',
  placeOther: 'Somewhere else',

  religionTitle: 'Any tradition to follow?',
  religionHelp: 'This is entirely up to you. It only helps us tailor the guidance.',
  hindu: 'Hindu',
  muslim: 'Muslim',
  christian: 'Christian',
  sikh: 'Sikh',
  secular: 'No tradition / secular',

  checklistTitle: 'Here is what needs to happen',
  progressSuffix: 'steps done',
  phaseRightNow: 'Right now',
  phaseToday: 'Today',
  phaseNextFewDays: 'Next few days',
  phaseNextFewWeeks: 'Within a few weeks',
  taskNotStarted: 'Not started',
  taskInProgress: 'In progress',
  taskDone: 'Done',
  callForHelp: 'Call for help',

  whyThisIsNeeded: 'Why this is needed',
  documentsNeeded: 'Documents you will need',
  addLater: 'Add later',
  attached: 'Attached',
  callNow: 'Call now',
  markDone: 'Mark as done',
  markUndone: 'Undo — not done yet',
  skipTask: 'Not for us',
  undoSkip: 'Undo skip',
  taskDoneCaption: "Done. That's one less thing.",
  taskSkippedCaption: 'Okay, skipped.',
  openInMaps: 'Find near you',
  urgencyNote: 'Please note',

  unexpectedTitle: 'Was this unexpected or accidental?',
  unexpectedHelp: 'If yes, we will add a police-report step and a note about post-mortem. If unsure, leave this off — it can be added later.',
  yes: 'Yes',
  no: 'No',
  privacyLine: 'No sign-up. Nothing leaves this device until you choose to.',
  phaseComingMonths: 'In the coming months',
  localSearchesTitle: 'Find near you',
  nationalContactsTitle: 'Verified helplines',

  contactsTitle: 'People you can call',
  call: 'Call',

  vaultTitle: 'Your documents',
  vaultHelp: 'Only you can see these. They stay on this device unless you choose to save them.',
  enterPhone: 'Enter your mobile number',
  sendOtp: 'Send code',
  enterOtp: 'Enter the 6-digit code',
  otpHint: 'For testing, use 123456.',
  verify: 'Verify',
  addDocument: 'Add a document',
  takePhoto: 'Take a photo',
  chooseFromLibrary: 'Choose from gallery',
  docAadhaar: 'Aadhaar',
  docId: 'Photo ID',
  docInsurance: 'Insurance policy',
  docHospital: 'Hospital papers',
  remove: 'Remove',

  shareTitle: 'A message for the family',
  shareHelp: "We've drafted a calm, factual update. Change it as you like, then send.",
  timeLabel: 'Cremation / burial time',
  placeLabel: 'Cremation / burial place',
  nameLabel: 'From (family name)',
  openWhatsApp: 'Open in WhatsApp',

  settingsTitle: 'Settings',
  changeLanguage: 'Language',
  changeLocation: 'Change location',
  startOver: 'Start a new checklist',
  clearAll: 'Clear everything from this device',
  clearConfirm: 'This will remove all your saved information. Are you sure?',
  cancel: 'Cancel',
  yesClear: 'Yes, clear everything',
  reminders: 'Reminders',
  remindersHelp: 'Quiet nudges when things need attention. No sound, no alarms.',
  enableReminders: 'Turn on reminders',
  remindersOn: 'Reminders are on',
};

const hi: Dict = {
  appName: 'एक कोमल मार्गदर्शक',
  landingSub: 'हम आपके साथ एक-एक कदम चलेंगे।',
  startButton: 'शुरू करें — मुझे अभी मदद चाहिए',
  continueLink: 'जहाँ छोड़ा था वहाँ से जारी रखें',
  next: 'आगे',
  skip: 'छोड़ दें',
  back: 'पीछे',
  step: 'चरण',

  locationTitle: 'आप कहाँ हैं?',
  locationHelp: 'ताकि हम पास की सेवाएँ दिखा सकें। बाद में बदल सकते हैं।',
  locationPlaceholder: 'शहर या क्षेत्र',
  useMyLocation: 'मेरा वर्तमान स्थान इस्तेमाल करें',
  detecting: 'खोज रहे हैं…',

  placeTitle: 'उनका देहांत कहाँ हुआ?',
  placeHospital: 'अस्पताल में',
  placeHome: 'घर पर',
  placeOther: 'कहीं और',

  religionTitle: 'कोई परंपरा है?',
  religionHelp: 'यह पूरी तरह आपकी पसंद है।',
  hindu: 'हिन्दू',
  muslim: 'मुस्लिम',
  christian: 'ईसाई',
  sikh: 'सिख',
  secular: 'कोई परंपरा नहीं',

  checklistTitle: 'यह करना है',
  progressSuffix: 'चरण पूरे',
  phaseRightNow: 'अभी',
  phaseToday: 'आज',
  phaseNextFewDays: 'अगले कुछ दिन',
  phaseNextFewWeeks: 'कुछ सप्ताह में',
  taskNotStarted: 'शुरू नहीं हुआ',
  taskInProgress: 'चल रहा है',
  taskDone: 'हो गया',
  callForHelp: 'मदद के लिए कॉल करें',

  whyThisIsNeeded: 'यह क्यों ज़रूरी है',
  documentsNeeded: 'ज़रूरी कागज़ात',
  addLater: 'बाद में जोड़ें',
  attached: 'संलग्न',
  callNow: 'अभी कॉल करें',
  markDone: 'पूरा हुआ',
  markUndone: 'अभी पूरा नहीं',
  skipTask: 'हमारे लिए नहीं',
  undoSkip: 'वापस लाएँ',
  taskDoneCaption: 'हो गया। एक चिंता कम।',
  taskSkippedCaption: 'ठीक है, छोड़ दिया।',
  openInMaps: 'पास में खोजें',
  urgencyNote: 'ध्यान दें',

  unexpectedTitle: 'क्या यह अप्रत्याशित या दुर्घटनावश था?',
  unexpectedHelp: 'यदि हाँ, तो हम पुलिस-रिपोर्ट चरण जोड़ देंगे। यदि निश्चित नहीं हैं, तो छोड़ दें।',
  yes: 'हाँ',
  no: 'नहीं',
  privacyLine: 'कोई पंजीकरण नहीं। कुछ भी इस डिवाइस से बाहर नहीं जाता।',
  phaseComingMonths: 'आने वाले महीनों में',
  localSearchesTitle: 'पास में खोजें',
  nationalContactsTitle: 'सत्यापित हेल्पलाइनें',

  contactsTitle: 'जिन्हें कॉल कर सकते हैं',
  call: 'कॉल',

  vaultTitle: 'आपके कागज़ात',
  vaultHelp: 'केवल आप देख सकते हैं।',
  enterPhone: 'अपना मोबाइल नंबर दें',
  sendOtp: 'कोड भेजें',
  enterOtp: '6 अंक का कोड डालें',
  otpHint: 'परीक्षण के लिए 123456 का उपयोग करें।',
  verify: 'सत्यापित करें',
  addDocument: 'कागज़ जोड़ें',
  takePhoto: 'फ़ोटो लें',
  chooseFromLibrary: 'गैलरी से चुनें',
  docAadhaar: 'आधार',
  docId: 'पहचान पत्र',
  docInsurance: 'बीमा पॉलिसी',
  docHospital: 'अस्पताल के कागज़',
  remove: 'हटाएँ',

  shareTitle: 'परिवार के लिए संदेश',
  shareHelp: 'हमने एक शांत संदेश तैयार किया है। जैसा चाहें बदल दें।',
  timeLabel: 'अंतिम संस्कार का समय',
  placeLabel: 'अंतिम संस्कार का स्थान',
  nameLabel: 'भेजने वाले (परिवार का नाम)',
  openWhatsApp: 'व्हाट्सएप में खोलें',

  settingsTitle: 'सेटिंग्स',
  changeLanguage: 'भाषा',
  changeLocation: 'स्थान बदलें',
  startOver: 'नई चेकलिस्ट शुरू करें',
  clearAll: 'इस डिवाइस से सब हटाएँ',
  clearConfirm: 'सब कुछ हटा दिया जाएगा। क्या आप सुनिश्चित हैं?',
  cancel: 'रद्द करें',
  yesClear: 'हाँ, सब हटाएँ',
  reminders: 'याद दिलाना',
  remindersHelp: 'कोई तेज़ आवाज़ नहीं, बस शांत सूचना।',
  enableReminders: 'याद दिलाना चालू करें',
  remindersOn: 'याद दिलाना चालू है',
};

const ta: Dict = {
  appName: 'ஒரு மென்மையான வழிகாட்டி',
  landingSub: 'ஒவ்வொரு படியாக நாங்கள் உங்களுடன் நடப்போம்.',
  startButton: 'தொடங்குக — எனக்கு இப்போதே உதவி வேண்டும்',
  continueLink: 'விட்ட இடத்திலிருந்து தொடர',
  next: 'அடுத்து',
  skip: 'தவிர்க்க',
  back: 'பின்',
  step: 'படி',

  locationTitle: 'நீங்கள் எங்கே இருக்கிறீர்கள்?',
  locationHelp: 'அருகிலுள்ள சேவைகளை காட்ட உதவும்.',
  locationPlaceholder: 'நகரம் அல்லது பகுதி',
  useMyLocation: 'எனது தற்போதைய இடத்தைப் பயன்படுத்து',
  detecting: 'கண்டறிகிறோம்…',

  placeTitle: 'எங்கே இறந்தார்?',
  placeHospital: 'மருத்துவமனையில்',
  placeHome: 'வீட்டில்',
  placeOther: 'வேறு இடத்தில்',

  religionTitle: 'ஏதாவது பாரம்பரியம்?',
  religionHelp: 'இது முற்றிலும் உங்கள் விருப்பம்.',
  hindu: 'இந்து',
  muslim: 'முஸ்லிம்',
  christian: 'கிறிஸ்தவர்',
  sikh: 'சீக்கியர்',
  secular: 'எந்த பாரம்பரியமும் இல்லை',

  checklistTitle: 'இதைச் செய்ய வேண்டும்',
  progressSuffix: 'படிகள் முடிந்தது',
  phaseRightNow: 'இப்போதே',
  phaseToday: 'இன்று',
  phaseNextFewDays: 'அடுத்த சில நாட்களில்',
  phaseNextFewWeeks: 'சில வாரங்களில்',
  taskNotStarted: 'தொடங்கவில்லை',
  taskInProgress: 'நடந்து கொண்டிருக்கிறது',
  taskDone: 'முடிந்தது',
  callForHelp: 'உதவிக்கு அழை',

  whyThisIsNeeded: 'இது ஏன் தேவை',
  documentsNeeded: 'தேவையான ஆவணங்கள்',
  addLater: 'பின்னர் சேர்க்கவும்',
  attached: 'இணைக்கப்பட்டது',
  callNow: 'இப்போது அழை',
  markDone: 'முடிந்தது என்று குறி',
  markUndone: 'இன்னும் முடியவில்லை',
  skipTask: 'எங்களுக்கு பொருந்தாது',
  undoSkip: 'மீட்டெடு',
  taskDoneCaption: 'முடிந்தது. ஒரு கவலை குறைந்தது.',
  taskSkippedCaption: 'சரி, தவிர்க்கப்பட்டது.',
  openInMaps: 'அருகில் தேடு',
  urgencyNote: 'குறிப்பு',

  unexpectedTitle: 'இது எதிர்பாராதது அல்லது விபத்தா?',
  unexpectedHelp: 'ஆம் என்றால், நாங்கள் ஒரு காவல்துறை-அறிக்கை படியை சேர்ப்போம். உறுதியாக இல்லாவிட்டால் விட்டுவிடவும்.',
  yes: 'ஆம்',
  no: 'இல்லை',
  privacyLine: 'பதிவு தேவையில்லை. எதுவும் இந்த சாதனத்தை விட்டு வெளியேறாது.',
  phaseComingMonths: 'வரும் மாதங்களில்',
  localSearchesTitle: 'அருகில் தேடு',
  nationalContactsTitle: 'சரிபார்க்கப்பட்ட உதவி எண்கள்',

  contactsTitle: 'நீங்கள் அழைக்கக்கூடியவர்கள்',
  call: 'அழை',

  vaultTitle: 'உங்கள் ஆவணங்கள்',
  vaultHelp: 'உங்களால் மட்டுமே பார்க்க முடியும்.',
  enterPhone: 'உங்கள் மொபைல் எண்ணை உள்ளிடவும்',
  sendOtp: 'குறியீட்டை அனுப்பு',
  enterOtp: '6-இலக்க குறியீட்டை உள்ளிடவும்',
  otpHint: 'சோதனைக்கு 123456 ஐப் பயன்படுத்தவும்.',
  verify: 'சரிபார்',
  addDocument: 'ஆவணத்தை சேர்',
  takePhoto: 'புகைப்படம் எடு',
  chooseFromLibrary: 'கேலரியிலிருந்து தேர்',
  docAadhaar: 'ஆதார்',
  docId: 'அடையாள அட்டை',
  docInsurance: 'காப்பீட்டு ஆவணம்',
  docHospital: 'மருத்துவமனை ஆவணங்கள்',
  remove: 'நீக்கு',

  shareTitle: 'குடும்பத்திற்கான செய்தி',
  shareHelp: 'ஒரு அமைதியான செய்தியை உருவாக்கியுள்ளோம்.',
  timeLabel: 'இறுதிச் சடங்கு நேரம்',
  placeLabel: 'இறுதிச் சடங்கு இடம்',
  nameLabel: 'அனுப்புபவர் (குடும்பப் பெயர்)',
  openWhatsApp: 'வாட்ஸ்அப்பில் திற',

  settingsTitle: 'அமைப்புகள்',
  changeLanguage: 'மொழி',
  changeLocation: 'இடத்தை மாற்று',
  startOver: 'புதிய பட்டியல் தொடங்கு',
  clearAll: 'இந்த சாதனத்திலிருந்து அனைத்தையும் அழி',
  clearConfirm: 'சேமிக்கப்பட்ட அனைத்தும் நீக்கப்படும். உறுதியா?',
  cancel: 'ரத்து',
  yesClear: 'ஆம், அனைத்தையும் அழி',
  reminders: 'நினைவூட்டல்கள்',
  remindersHelp: 'சத்தமில்லாத அமைதியான அறிவிப்புகள்.',
  enableReminders: 'நினைவூட்டல்களை இயக்கு',
  remindersOn: 'நினைவூட்டல்கள் இயக்கத்தில்',
};

const DICTS: Record<Lang, Dict> = { en, hi, ta };
const KEY = 'lang';

let current: Lang = 'en';
const listeners = new Set<() => void>();

export async function initLang() {
  const stored = await AsyncStorage.getItem(KEY);
  if (stored === 'hi' || stored === 'ta' || stored === 'en') {
    current = stored;
  }
}

export function getLang(): Lang {
  return current;
}

export async function setLang(l: Lang) {
  current = l;
  await AsyncStorage.setItem(KEY, l);
  listeners.forEach((cb) => cb());
}

export function t(key: string): string {
  return DICTS[current][key] ?? DICTS.en[key] ?? key;
}

export function useI18n() {
  const [, force] = useState(0);
  const rerender = useCallback(() => force((n) => n + 1), []);
  useEffect(() => {
    listeners.add(rerender);
    return () => {
      listeners.delete(rerender);
    };
  }, [rerender]);
  return { t, lang: current, setLang };
}

export const LANG_LABELS: Record<Lang, string> = {
  en: 'English',
  hi: 'हिन्दी (Hindi)',
  ta: 'தமிழ் (Tamil)',
};
