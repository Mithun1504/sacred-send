import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback } from 'react';

export type Lang = 'en' | 'hi' | 'ta' | 'kn' | 'te';

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

const kn: Dict = {
  appName: 'ಒಂದು ಮೃದು ಮಾರ್ಗದರ್ಶಿ',
  landingSub: 'ಒಂದೊಂದೇ ಹೆಜ್ಜೆ, ನಿಮ್ಮ ಜೊತೆಗೆ ನಡೆಯುತ್ತೇವೆ.',
  startButton: 'ಪ್ರಾರಂಭಿಸಿ — ನನಗೆ ಈಗಲೇ ಸಹಾಯ ಬೇಕು',
  continueLink: 'ನಾನು ಬಿಟ್ಟಲ್ಲಿಂದ ಮುಂದುವರಿಸಿ',
  next: 'ಮುಂದೆ',
  skip: 'ಬಿಟ್ಟುಬಿಡಿ',
  back: 'ಹಿಂದೆ',
  step: 'ಹಂತ',

  locationTitle: 'ನೀವು ಎಲ್ಲಿದ್ದೀರಿ?',
  locationHelp: 'ಇದು ಹತ್ತಿರದ ಸೇವೆಗಳನ್ನು ತೋರಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.',
  locationPlaceholder: 'ನಗರ ಅಥವಾ ಪ್ರದೇಶ',
  useMyLocation: 'ನನ್ನ ಪ್ರಸ್ತುತ ಸ್ಥಳವನ್ನು ಬಳಸಿ',
  detecting: 'ಪತ್ತೆಹಚ್ಚಲಾಗುತ್ತಿದೆ…',

  placeTitle: 'ಎಲ್ಲಿ ನಿಧನರಾದರು?',
  placeHospital: 'ಆಸ್ಪತ್ರೆಯಲ್ಲಿ',
  placeHome: 'ಮನೆಯಲ್ಲಿ',
  placeOther: 'ಬೇರೆ ಎಲ್ಲಿಯಾದರೂ',

  religionTitle: 'ಯಾವುದಾದರೂ ಸಂಪ್ರದಾಯವಿದೆಯೇ?',
  religionHelp: 'ಇದು ಸಂಪೂರ್ಣ ನಿಮ್ಮ ಆಯ್ಕೆ. ಇದು ಕೇವಲ ಮಾರ್ಗದರ್ಶನವನ್ನು ಸೂಕ್ತಗೊಳಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.',
  hindu: 'ಹಿಂದೂ',
  muslim: 'ಮುಸ್ಲಿಂ',
  christian: 'ಕ್ರಿಶ್ಚಿಯನ್',
  sikh: 'ಸಿಖ್',
  secular: 'ಯಾವುದೇ ಸಂಪ್ರದಾಯವಿಲ್ಲ',

  checklistTitle: 'ಇದನ್ನು ಮಾಡಬೇಕಾಗಿದೆ',
  progressSuffix: 'ಹಂತಗಳು ಮುಗಿದಿವೆ',
  phaseRightNow: 'ಈಗಲೇ',
  phaseToday: 'ಇಂದು',
  phaseNextFewDays: 'ಮುಂದಿನ ಕೆಲವು ದಿನಗಳಲ್ಲಿ',
  phaseNextFewWeeks: 'ಕೆಲವು ವಾರಗಳಲ್ಲಿ',
  taskNotStarted: 'ಪ್ರಾರಂಭವಾಗಿಲ್ಲ',
  taskInProgress: 'ನಡೆಯುತ್ತಿದೆ',
  taskDone: 'ಮುಗಿದಿದೆ',
  callForHelp: 'ಸಹಾಯಕ್ಕಾಗಿ ಕರೆ ಮಾಡಿ',

  whyThisIsNeeded: 'ಇದು ಏಕೆ ಬೇಕು',
  documentsNeeded: 'ಬೇಕಾದ ದಾಖಲೆಗಳು',
  addLater: 'ನಂತರ ಸೇರಿಸಿ',
  attached: 'ಲಗತ್ತಿಸಲಾಗಿದೆ',
  callNow: 'ಈಗ ಕರೆ ಮಾಡಿ',
  markDone: 'ಮುಗಿದಿದೆ ಎಂದು ಗುರುತಿಸಿ',
  markUndone: 'ಇನ್ನೂ ಮುಗಿದಿಲ್ಲ',
  skipTask: 'ನಮಗೆ ಅನ್ವಯಿಸುವುದಿಲ್ಲ',
  undoSkip: 'ಮರಳಿ ತನ್ನಿ',
  taskDoneCaption: 'ಮುಗಿಯಿತು. ಒಂದು ಚಿಂತೆ ಕಡಿಮೆ.',
  taskSkippedCaption: 'ಸರಿ, ಬಿಟ್ಟುಬಿಡಲಾಗಿದೆ.',
  openInMaps: 'ಹತ್ತಿರದಲ್ಲಿ ಹುಡುಕಿ',
  urgencyNote: 'ಗಮನಿಸಿ',

  unexpectedTitle: 'ಇದು ಅನಿರೀಕ್ಷಿತವಾಗಿತ್ತೇ ಅಥವಾ ಅಪಘಾತವಾಗಿತ್ತೇ?',
  unexpectedHelp: 'ಹೌದು ಎಂದಾದರೆ, ನಾವು ಪೊಲೀಸ್ ವರದಿಯ ಹಂತವನ್ನು ಸೇರಿಸುತ್ತೇವೆ. ಖಚಿತವಿಲ್ಲದಿದ್ದರೆ ಬಿಟ್ಟುಬಿಡಿ.',
  yes: 'ಹೌದು',
  no: 'ಇಲ್ಲ',
  privacyLine: 'ನೋಂದಣಿ ಇಲ್ಲ. ಏನೂ ಈ ಸಾಧನದಿಂದ ಹೊರಗೆ ಹೋಗುವುದಿಲ್ಲ.',
  phaseComingMonths: 'ಮುಂಬರುವ ತಿಂಗಳುಗಳಲ್ಲಿ',
  localSearchesTitle: 'ಹತ್ತಿರದಲ್ಲಿ ಹುಡುಕಿ',
  nationalContactsTitle: 'ಪರಿಶೀಲಿಸಿದ ಸಹಾಯವಾಣಿಗಳು',

  contactsTitle: 'ನೀವು ಕರೆ ಮಾಡಬಹುದಾದವರು',
  call: 'ಕರೆ',

  vaultTitle: 'ನಿಮ್ಮ ದಾಖಲೆಗಳು',
  vaultHelp: 'ನೀವು ಮಾತ್ರ ಇವುಗಳನ್ನು ನೋಡಬಹುದು.',
  enterPhone: 'ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ',
  sendOtp: 'ಕೋಡ್ ಕಳುಹಿಸಿ',
  enterOtp: '6-ಅಂಕಿಯ ಕೋಡ್ ನಮೂದಿಸಿ',
  otpHint: 'ಪರೀಕ್ಷೆಗಾಗಿ 123456 ಬಳಸಿ.',
  verify: 'ದೃಢೀಕರಿಸಿ',
  addDocument: 'ದಾಖಲೆ ಸೇರಿಸಿ',
  takePhoto: 'ಫೋಟೋ ತೆಗೆಯಿರಿ',
  chooseFromLibrary: 'ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ',
  docAadhaar: 'ಆಧಾರ್',
  docId: 'ಗುರುತಿನ ಚೀಟಿ',
  docInsurance: 'ವಿಮಾ ದಾಖಲೆ',
  docHospital: 'ಆಸ್ಪತ್ರೆ ದಾಖಲೆಗಳು',
  remove: 'ತೆಗೆದುಹಾಕಿ',

  shareTitle: 'ಕುಟುಂಬಕ್ಕೆ ಸಂದೇಶ',
  shareHelp: 'ನಾವು ಶಾಂತವಾದ ಸಂದೇಶವನ್ನು ಸಿದ್ಧಪಡಿಸಿದ್ದೇವೆ. ಬೇಕಾದಂತೆ ಬದಲಾಯಿಸಿ.',
  timeLabel: 'ಅಂತಿಮ ಸಂಸ್ಕಾರದ ಸಮಯ',
  placeLabel: 'ಅಂತಿಮ ಸಂಸ್ಕಾರದ ಸ್ಥಳ',
  nameLabel: 'ಕಳುಹಿಸುವವರು (ಕುಟುಂಬದ ಹೆಸರು)',
  openWhatsApp: 'ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ',

  settingsTitle: 'ಸೆಟ್ಟಿಂಗ್ಸ್',
  changeLanguage: 'ಭಾಷೆ',
  changeLocation: 'ಸ್ಥಳ ಬದಲಾಯಿಸಿ',
  startOver: 'ಹೊಸ ಪಟ್ಟಿ ಪ್ರಾರಂಭಿಸಿ',
  clearAll: 'ಈ ಸಾಧನದಿಂದ ಎಲ್ಲವನ್ನೂ ಅಳಿಸಿ',
  clearConfirm: 'ಎಲ್ಲಾ ಉಳಿಸಿದ ಮಾಹಿತಿಯನ್ನು ತೆಗೆದುಹಾಕಲಾಗುತ್ತದೆ. ಖಚಿತವೇ?',
  cancel: 'ರದ್ದುಗೊಳಿಸಿ',
  yesClear: 'ಹೌದು, ಎಲ್ಲವನ್ನೂ ಅಳಿಸಿ',
  reminders: 'ಜ್ಞಾಪನೆಗಳು',
  remindersHelp: 'ಶಬ್ದವಿಲ್ಲದ ಶಾಂತ ಸೂಚನೆಗಳು.',
  enableReminders: 'ಜ್ಞಾಪನೆಗಳನ್ನು ಆನ್ ಮಾಡಿ',
  remindersOn: 'ಜ್ಞಾಪನೆಗಳು ಆನ್ ಆಗಿವೆ',
};

const te: Dict = {
  appName: 'ఒక సున్నితమైన మార్గదర్శి',
  landingSub: 'ఒక్కో అడుగుగా, మేము మీతో పాటు నడుస్తాము.',
  startButton: 'ప్రారంభించండి — నాకు ఇప్పుడే సహాయం కావాలి',
  continueLink: 'ఆపిన చోటు నుండి కొనసాగించండి',
  next: 'తర్వాత',
  skip: 'దాటవేయండి',
  back: 'వెనుకకు',
  step: 'దశ',

  locationTitle: 'మీరు ఎక్కడ ఉన్నారు?',
  locationHelp: 'దగ్గరలోని సేవలను చూపడానికి ఇది సహాయపడుతుంది.',
  locationPlaceholder: 'నగరం లేదా ప్రాంతం',
  useMyLocation: 'నా ప్రస్తుత స్థానాన్ని ఉపయోగించండి',
  detecting: 'కనుగొంటున్నాము…',

  placeTitle: 'ఎక్కడ మరణించారు?',
  placeHospital: 'ఆసుపత్రిలో',
  placeHome: 'ఇంట్లో',
  placeOther: 'మరెక్కడైనా',

  religionTitle: 'ఏదైనా సంప్రదాయం ఉందా?',
  religionHelp: 'ఇది పూర్తిగా మీ ఇష్టం. మార్గదర్శనాన్ని అనుకూలంగా చేయడానికి మాత్రమే.',
  hindu: 'హిందూ',
  muslim: 'ముస్లిం',
  christian: 'క్రైస్తవ',
  sikh: 'సిక్కు',
  secular: 'ఏ సంప్రదాయం లేదు',

  checklistTitle: 'ఇది చేయాలి',
  progressSuffix: 'దశలు పూర్తయ్యాయి',
  phaseRightNow: 'ఇప్పుడే',
  phaseToday: 'ఈరోజు',
  phaseNextFewDays: 'రాబోయే కొన్ని రోజుల్లో',
  phaseNextFewWeeks: 'కొన్ని వారాల్లో',
  taskNotStarted: 'ప్రారంభం కాలేదు',
  taskInProgress: 'జరుగుతోంది',
  taskDone: 'పూర్తయింది',
  callForHelp: 'సహాయం కోసం కాల్ చేయండి',

  whyThisIsNeeded: 'ఇది ఎందుకు అవసరం',
  documentsNeeded: 'అవసరమైన పత్రాలు',
  addLater: 'తర్వాత జోడించండి',
  attached: 'జోడించబడింది',
  callNow: 'ఇప్పుడే కాల్ చేయండి',
  markDone: 'పూర్తయిందని గుర్తు పెట్టండి',
  markUndone: 'ఇంకా పూర్తి కాలేదు',
  skipTask: 'మాకు వర్తించదు',
  undoSkip: 'తిరిగి తీసుకురండి',
  taskDoneCaption: 'పూర్తయింది. ఒక ఆందోళన తగ్గింది.',
  taskSkippedCaption: 'సరే, దాటవేయబడింది.',
  openInMaps: 'దగ్గరలో వెతకండి',
  urgencyNote: 'గమనిక',

  unexpectedTitle: 'ఇది ఊహించనిదా లేదా ప్రమాదవశాత్తు జరిగినదా?',
  unexpectedHelp: 'అవును అయితే, మేము పోలీసు నివేదిక దశను జోడిస్తాము. ఖచ్చితంగా తెలియకపోతే వదిలేయండి.',
  yes: 'అవును',
  no: 'కాదు',
  privacyLine: 'నమోదు అవసరం లేదు. ఏదీ ఈ పరికరం నుండి బయటికి వెళ్లదు.',
  phaseComingMonths: 'రాబోయే నెలల్లో',
  localSearchesTitle: 'దగ్గరలో వెతకండి',
  nationalContactsTitle: 'ధృవీకరించిన సహాయవాణులు',

  contactsTitle: 'మీరు కాల్ చేయగలిగినవారు',
  call: 'కాల్',

  vaultTitle: 'మీ పత్రాలు',
  vaultHelp: 'మీరు మాత్రమే వీటిని చూడగలరు.',
  enterPhone: 'మీ మొబైల్ నంబర్ నమోదు చేయండి',
  sendOtp: 'కోడ్ పంపండి',
  enterOtp: '6-అంకెల కోడ్‌ను నమోదు చేయండి',
  otpHint: 'పరీక్ష కోసం 123456 ఉపయోగించండి.',
  verify: 'ధృవీకరించండి',
  addDocument: 'పత్రం జోడించండి',
  takePhoto: 'ఫోటో తీయండి',
  chooseFromLibrary: 'గ్యాలరీ నుండి ఎంచుకోండి',
  docAadhaar: 'ఆధార్',
  docId: 'గుర్తింపు కార్డు',
  docInsurance: 'బీమా పత్రం',
  docHospital: 'ఆసుపత్రి పత్రాలు',
  remove: 'తొలగించండి',

  shareTitle: 'కుటుంబం కోసం సందేశం',
  shareHelp: 'మేము ప్రశాంతమైన సందేశాన్ని సిద్ధం చేశాము. కావాలంటే మార్చండి.',
  timeLabel: 'అంతిమ సంస్కారం సమయం',
  placeLabel: 'అంతిమ సంస్కారం స్థలం',
  nameLabel: 'పంపేవారు (కుటుంబం పేరు)',
  openWhatsApp: 'వాట్సాప్‌లో తెరవండి',

  settingsTitle: 'సెట్టింగ్‌లు',
  changeLanguage: 'భాష',
  changeLocation: 'స్థానం మార్చండి',
  startOver: 'కొత్త జాబితా ప్రారంభించండి',
  clearAll: 'ఈ పరికరం నుండి అన్నింటినీ తొలగించండి',
  clearConfirm: 'సేవ్ చేసిన మొత్తం సమాచారం తొలగించబడుతుంది. ఖచ్చితంగానా?',
  cancel: 'రద్దు',
  yesClear: 'అవును, అన్నింటినీ తొలగించండి',
  reminders: 'రిమైండర్‌లు',
  remindersHelp: 'శబ్దం లేని నిశ్శబ్ద సూచనలు.',
  enableReminders: 'రిమైండర్‌లను ఆన్ చేయండి',
  remindersOn: 'రిమైండర్‌లు ఆన్‌లో ఉన్నాయి',
};

const DICTS: Record<Lang, Dict> = { en, hi, ta, kn, te };
const KEY = 'lang';

let current: Lang = 'en';
const listeners = new Set<() => void>();

export async function initLang() {
  const stored = await AsyncStorage.getItem(KEY);
  if (stored === 'hi' || stored === 'ta' || stored === 'kn' || stored === 'te' || stored === 'en') {
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
  kn: 'ಕನ್ನಡ (Kannada)',
  te: 'తెలుగు (Telugu)',
};
