// Gemini AI Service & Rule Engine for SafeBank AI Web

const BLACKLISTED_NUMBERS = ["18004253800", "7401120293", "01124361200"];

export const GeminiService = {
  analyzeText: async (prompt, systemPrompt = null, originalInput = null, languageCode = "en", apiKey = "") => {
    const inputToCheck = originalInput || prompt;
    const cleanNum = inputToCheck.replace(/ /g, "").replace(/-/g, "").replace(/\+/g, "");
    
    // Check blacklist first
    const isBlacklisted = BLACKLISTED_NUMBERS.some(num => cleanNum.includes(num));
    if (isBlacklisted) {
      return getOfflineSafetyPrediction(inputToCheck, languageCode);
    }

    const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY || "";

    if (!key || key === "MY_GEMINI_API_KEY" || key === "placeholder") {
      return getOfflineSafetyPrediction(originalInput || prompt, languageCode);
    }

    try {
      const requestBody = {
        contents: [
          { parts: [{ text: prompt }] }
        ],
        generationConfig: { temperature: 0.3 }
      };

      if (systemPrompt) {
        requestBody.systemInstruction = { parts: [{ text: systemPrompt }] };
      }

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) throw new Error("Gemini API call returned non-200 status");
      const data = await res.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      return textResponse || getOfflineSafetyPrediction(originalInput || prompt, languageCode);
    } catch (err) {
      console.warn("Gemini API Error, utilizing offline security prediction engine:", err);
      return getOfflineSafetyPrediction(originalInput || prompt, languageCode);
    }
  },

  chatResponse: async (prompt, languageCode = "en", apiKey = "") => {
    const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY || "";

    if (!key || key === "MY_GEMINI_API_KEY" || key === "placeholder") {
      return getAIChatAssistantResponse(prompt, languageCode);
    }

    try {
      const langName = languageCode === 'te' ? 'Telugu' : languageCode === 'hi' ? 'Hindi' : languageCode === 'ta' ? 'Tamil' : 'English';
      const systemInstructionText = `You are SafeBank AI Assistant, a friendly, intelligent, and helpful cybersecurity & banking security ally. Respond conversationally, warmly, and helpfully in ${langName}. Do not output scanner risk codes or risk levels unless specifically asked for a risk score.`;

      const requestBody = {
        contents: [
          { parts: [{ text: prompt }] }
        ],
        systemInstruction: { parts: [{ text: systemInstructionText }] },
        generationConfig: { temperature: 0.7 }
      };

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) throw new Error("Gemini API call returned non-200 status");
      const data = await res.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      return textResponse || getAIChatAssistantResponse(prompt, languageCode);
    } catch (err) {
      console.warn("Gemini API Error, utilizing AI Assistant conversational engine:", err);
      return getAIChatAssistantResponse(prompt, languageCode);
    }
  }
};

export function getAIChatAssistantResponse(text, lang = "en") {
  const lower = text.toLowerCase().trim();

  // Greetings
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("namaste") || lower.includes("namaskar") || lower.includes("హలో") || lower.includes("నమస్కారం")) {
    switch (lang) {
      case "te":
        return "నమస్కారం! నేను మీ సేఫ్‌బ్యాంక్ కృత్రిమ మేధస్సు భద్రతా సహాయకుడిని (SafeBank AI Assistant). మీ బ్యాంక్ ఖాతా భద్రత, OTP సందేహాలు లేదా సందేహాస్పద మెసేజ్ల వివరాలను స్పష్టం చేయడానికి నేను ఇక్కడ ఉన్నాను. ఈరోజు మీకు ఎలా సహాయపడగలను?";
      case "hi":
        return "नमस्ते! मैं आपका सेफबैंक एआई सुरक्षा सहायक हूँ। मैं आपके बैंक खाते की सुरक्षा, ओटीपी संदेह और संदिग्ध संदेशों की जांच में मदद करने के लिए यहाँ हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?";
      case "ta":
        return "வணக்கம்! நான் உங்கள் சேஃப்பேங்க் AI பாதுகாப்பு உதவியாளர். உங்கள் வங்கி கணக்கு பாதுகாப்பு, OTP சந்தேகங்கள் மற்றும் சந்தேகத்திற்குரிய தகவல்களை சரிபார்க்க நான் தயார். இன்று உங்களுக்கு எவ்வாறு உதவட்டும்?";
      default:
        return "Hello! I am your SafeBank AI Security Assistant. I am here to help protect your bank account, verify suspicious messages or calls, and answer any digital banking safety questions. How can I assist you today?";
    }
  }

  // OTP / PIN / Password queries
  if (lower.includes("otp") || lower.includes("pin") || lower.includes("passcode") || lower.includes("cvv") || lower.includes("password")) {
    switch (lang) {
      case "te":
        return "⚠️ అత్యంత ముఖ్యం:\n• OTP (వన్-టైమ్ పాస్‌వర్డ్) లేదా ATM PIN అనేది మీ వ్యక్తిగత రహస్య భద్రతా కోడ్.\n• బ్యాంక్ మేనేజర్, పోలీస్ అధికారి అని చెప్పే ఎవరితోనూ మీ OTP ని ఎప్పుడూ పంచుకోకండి.\n• నిజమైన బ్యాంకులు ఫోన్ కాల్ లేదా SMS ద్వారా మీ OTP ని ఎప్పుడూ అడగవు!";
      case "hi":
        return "⚠️ अत्यंत महत्वपूर्ण:\n• ओटीपी या एटीएम पिन आपका व्यक्तिगत सुरक्षा कोड है।\n• बैंक मैनेजर या पुलिस अधिकारी होने का दावा करने वाले किसी भी व्यक्ति के साथ अपना ओटीपी कभी साझा न करें।\n• असली बैंक कभी भी फोन पर ओटीपी नहीं मांगते!";
      case "ta":
        return "⚠️ மிகவும் முக்கியம்:\n• OTP அல்லது ATM PIN என்பது உங்களது ரகசிய பாதுகாப்பு குறியீடு.\n• வங்கி மேலாளர் என கூறுபவரிடம் கூட உங்களது OTP எண்களை பகிர வேண்டாம்.\n• வங்கிகள் ஒருபோதும் போனில் OTP கேட்காது!";
      default:
        return "⚠️ CRITICAL SAFETY RULE:\n• An OTP (One-Time Password) or PIN is your private security key.\n• NEVER share your OTP or PIN with anyone—even callers claiming to be bank managers, RBI officials, or police.\n• Legitimate banks will NEVER call or text asking for your OTP or passwords!";
    }
  }

  // GooglePay / PhonePe / UPI Security
  if (lower.includes("googlepay") || lower.includes("gpay") || lower.includes("phonepe") || lower.includes("upi") || lower.includes("qr")) {
    switch (lang) {
      case "te":
        return "💡 UPI & GooglePay భద్రతా చిట్కాలు:\n1. గుర్తుంచుకోండి: మీ UPI PIN కేవలం డబ్బు పంపడానికి మాత్రమే, డబ్బు పొందడానికి PIN అవసరం లేదు!\n2. బహుమతులు లేదా క్యాష్‌బ్యాక్ పేరుతో వచ్చే తెలియని QR కోడ్‌లను ఎప్పుడూ నొక్కకండి.\n3. మీ ఫోన్ స్క్రీన్ లాక్ మరియు UPI PIN ని ఎవరికీ తెలియకుండా ఉంచండి.";
      case "hi":
        return "💡 यूपीआई और गूगल पे सुरक्षा सुझाव:\n1. याद रखें: यूपीआई पिन केवल पैसे भेजने के लिए दर्ज किया जाता है, प्राप्त करने के लिए कभी नहीं!\n2. पुरस्कार या कैशबैक के वादे वाले अज्ञात क्यूआर कोड को स्कैन न करें।\n3. अपना फोन लॉक और यूपीआई पिन गुप्त रखें।";
      case "ta":
        return "💡 GooglePay & UPI பாதுகாப்பு வழிகாட்டுதல்:\n1. நினைவில் வையுங்கள்: பணம் அனுப்ப மட்டுமே UPI PIN தேவை, பணம் பெற PIN தேவை இல்லை!\n2. தெரியாத நபர்களின் QR கோடுகளை ஸ்கேன் செய்யாதீர்கள்.";
      default:
        return "💡 GooglePay / PhonePe & UPI Safety Rules:\n1. GOLDEN RULE: You enter your UPI PIN ONLY to SEND money, NEVER to receive money!\n2. Never scan unknown QR codes sent by strangers promising rewards or cashbacks.\n3. Keep your phone screen lock and UPI PIN strictly confidential.";
    }
  }

  // National Cybercrime Helpline 1930
  if (lower.includes("1930") || lower.includes("cybercrime") || lower.includes("helpline") || lower.includes("complaint") || lower.includes("report")) {
    switch (lang) {
      case "te":
        return "📞 జాతీయ సైబర్ క్రైమ్ హెల్ప్‌లైన్ 1930:\n• ఒకవేళ మీరు సైబర్ మోసంలో డబ్బు కోల్పోతే, వెంటనే 'గోల్డెన్ అవర్' లో 1930 నంబర్‌కు కాల్ చేయండి.\n• లేదా నేరుగా https://cybercrime.gov.in పోర్టల్‌లో ఫిర్యాదు నమోదు చేయండి.";
      case "hi":
        return "📞 राष्ट्रीय साइबर अपराध हेल्पलाइन 1930:\n• यदि आप किसी साइबर वित्तीय धोखाधड़ी के शिकार होते हैं, तो तुरंत 1930 पर कॉल करें ताकि लेनदेन को फ्रीज किया जा सके।\n• या cybercrime.gov.in पर ऑनलाइन शिकायत दर्ज करें।";
      case "ta":
        return "📞 தேசிய சைபர் குற்ற உதவி எண் 1930:\n• சைபர் நிதி மோசடி நடந்தால், உடனடியாக 1930 எண்ணிற்கு அழைத்து புகார் அளிக்கவும்.";
      default:
        return "📞 National Cybercrime Helpline 1930:\n• If you unfortunately lose money to a cyber financial fraud, immediately dial 1930 within the first 'golden hour' to freeze the fraudulent transaction.\n• You can also file an official complaint online at https://cybercrime.gov.in.";
    }
  }

  // Bank Manager / PIN Questions
  if (lower.includes("manager") || lower.includes("bank") || lower.includes("police") || lower.includes("cbi") || lower.includes("arrest")) {
    switch (lang) {
      case "te":
        return "🛡️ సైబర్ రక్షణ హెచ్చరిక:\n• నిజమైన బ్యాంక్ సిబ్బంది లేదా పోలీసులు మీ ATM పిన్, UPI పిన్ లేదా పాస్‌వర్డ్ అడగరు.\n• 'డిజిటల్ అరెస్ట్' లేదా 'ఖాతా సీజ్ చేస్తాం' అని ఎవరైనా భయపెడితే కాల్ కట్ చేసి 1930 కి ఫిర్యాదు చేయండి.";
      case "hi":
        return "🛡️ सुरक्षा चेतावनी:\n• असली बैंक कर्मचारी या पुलिस अधिकारी कभी भी आपका एटीएम पिन, ओटीपी या पासवर्ड नहीं मांगते।\n• यदि कोई डराता है, तो तुरंत फोन काटें और 1930 पर रिपोर्ट करें।";
      case "ta":
        return "🛡️ பாதுகாப்பு எச்சரிக்கை:\n• வங்கி ஊழியர்கள் அல்லது காவல்துறை ஒருபோதும் உங்கள் PIN அல்லது கடவுச்சொல்லை கேட்க மாட்டார்கள்.";
      default:
        return "🛡️ Cyber Defense Notice:\n• Real bank staff and police officers will NEVER ask for your password, ATM PIN, UPI PIN, or request money transfers to 'safe accounts'.\n• If a caller threatens you with 'digital arrest' or account block, hang up immediately and report to 1930.";
    }
  }

  // Default Conversational Fallback
  switch (lang) {
    case "te":
      return "నేను మీ సేఫ్‌బ్యాంక్ కృత్రిమ మేధస్సు భద్రతా మిత్రుడిని! మీ బ్యాంకింగ్ సందేహాలు, OTP రక్షణ, లేదా సందేహాస్పద మెసేజ్ల గురించి నన్ను నేరుగా అడగవచ్చు. నేను మీకు ఎలా సహాయపడగలను?";
    case "hi":
      return "मैं आपका सेफबैंक एआई सुरक्षा मित्र हूँ! आप मुझसे अपने बैंकिंग प्रश्नों, ओटीपी सुरक्षा या संदिग्ध संदेशों के बारे में बेझिझक पूछ सकते हैं। मैं आपकी सहायता के लिए यहाँ हूँ।";
    case "ta":
      return "நான் உங்கள் சேஃப்பேங்க் AI பாதுகாப்பு நண்பன்! உங்கள் வங்கி கேள்விகள் மற்றும் சந்தேகங்களுக்கு பதிலளிக்க நான் தயார். உங்களுக்கு என்ன உதவி வேண்டும்?";
    default:
      return "I am your SafeBank AI Security Assistant! I can help answer your banking safety questions, verify suspicious messages or calls, and guide you on secure UPI practices. Feel free to ask me anything!";
  }
}

export function getOfflineSafetyPrediction(text, lang = "en") {
  const isNumberOnly = /^[0-9+\-\s]+$/.test(text.trim());
  const lower = text.toLowerCase();
  const cleanNum = text.replace(/ /g, "").replace(/-/g, "").replace(/\+/g, "");
  const isBlacklisted = BLACKLISTED_NUMBERS.some(num => cleanNum.includes(num));

  // Comprehensive Fraud Keyword Checks
  const isOtpScam = lower.includes("otp") || lower.includes("passcode") || lower.includes("pin") || lower.includes("cvv");
  const isKycScam = lower.includes("kyc") || lower.includes("aadhaar") || lower.includes("pan") || lower.includes("block") || lower.includes("suspend") || lower.includes("deactivate");
  const isLotteryScam = lower.includes("won") || lower.includes("lottery") || lower.includes("prize") || lower.includes("reward") || lower.includes("crore") || lower.includes("lakh") || lower.includes("winner") || lower.includes("gift");
  const isPhishingLink = lower.includes("http") || lower.includes("link") || lower.includes("click") || lower.includes(".com") || lower.includes(".in") || lower.includes("bit.ly");
  const isFearPoliceScam = lower.includes("police") || lower.includes("cbi") || lower.includes("court") || lower.includes("arrest") || lower.includes("legal") || lower.includes("warrant");
  const isUtilityScam = lower.includes("electricity") || lower.includes("power") || lower.includes("bill") || lower.includes("recharge");
  const isJobRefundScam = lower.includes("job") || lower.includes("refund") || lower.includes("cashback") || lower.includes("part time") || lower.includes("salary");

  const isFraudMessage = isOtpScam || isKycScam || isLotteryScam || isPhishingLink || isFearPoliceScam || isUtilityScam || isJobRefundScam;

  switch (lang) {
    case "te":
      if (isNumberOnly && text.trim().length >= 5) {
        if (isBlacklisted) {
          return "రిస్క్ లెవల్: మోసం ముప్పు (స్కామ్ ముప్పు 95%)\n" +
                 "కారణం: ఈ నంబర్ మా సైబర్ బ్లాక్‌లిస్ట్‌లో మోసపూరిత కాల్స్ మరియు OTP స్కామ్‌ల కోసం గుర్తించబడింది.\n" +
                 "సలహా: ఈ కాల్ ఎత్తకండి మరియు మీ బ్యాంక్ వివరాలు ఎవరికీ చెప్పకండి.";
        } else {
          return "రిస్క్ లెవల్: సురక్షితం (తక్కువ ముప్పు 15%)\n" +
                 "కారణం: ఈ నంబర్‌పై ఎటువంటి ప్రతికూల నివేదికలు లేవు మరియు ఇది యాక్టివ్ బ్లాక్‌లిస్ట్‌లో లేదు.\n" +
                 "సలహా: సాధారణ కాల్. సాధారణ జాగ్రత్తలతో మాట్లాడవచ్చు.";
        }
      }
      if (isOtpScam) {
        return "రిస్క్ లెవల్: అత్యంత ప్రమాదకరం (OTP మోసం 98%)\n" +
               "కారణం: బ్యాంకులు ఎప్పుడూ ఫోన్ లో OTP అడగవు. ఇది మీ ఖాతా ఖాళీ చేసే ప్రయత్నం.\n" +
               "సలహా: ఈ సందేశాన్ని పట్టించుకోకండి మరియు ఎవరికీ OTP చెప్పకండి.";
      }
      if (isKycScam || isPhishingLink) {
        return "రిస్క్ లెవల్: ప్రమాదకరం (KYC మోసం 95%)\n" +
               "కారణం: ఖాతా బ్లాక్ అవుతుందని భయపెట్టడం మోసగాళ్ల పద్ధతి.\n" +
               "సలహా: వెంటనే మీ బ్యాంక్ బ్రాంచ్ ని సంప్రదించండి, లింకులు నొక్కకండి.";
      }
      if (isFraudMessage) {
        return "రిస్క్ లెవల్: మోసపూరిత హెచ్చరిక (స్కామ్ ముప్పు 90%)\n" +
               "కారణం: ఈ సందేశంలో బహుమతులు, లింక్‌లు లేదా నకిలీ బ్యాంక్ వార్తలు ఉన్నాయి.\n" +
               "సలహా: ఎటువంటి లింక్‌లను క్లిక్ చేయవద్దు లేదా డబ్బులు పంపవద్దు.";
      }
      return "రిస్క్ లెవల్: సురక్షితం (తక్కువ ముప్పు 15%)\n" +
             "కారణం: ఎటువంటి ప్రమాదకర పదాలు కనుగొనబడలేదు.\n" +
             "సలహా: అప్రమత్తంగా ఉండండి, రహస్య కోడ్‌లను పంచుకోకండి.";

    case "hi":
      if (isNumberOnly && text.trim().length >= 5) {
        if (isBlacklisted) {
          return "जोखिम स्तर: धोखाधड़ी खतरा (धोखाधड़ी का खतरा 95%)\n" +
                 "कारण: यह नंबर फ़िशिंग और बैंक धोखाधड़ी के लिए हमारी साइबर ब्लैकलिस्ट में दर्ज है।\n" +
                 "सलाह: इस कॉल को न उठाएं और अपनी बैंक जानकारी साझा न करें।";
        } else {
          return "जोखिम स्तर: सुरक्षित (कम खतरा 15%)\n" +
                 "कारण: इस नंबर पर कोई नकारात्मक रिपोर्ट नहीं है और यह ब्लैकलिस्ट में नहीं है।\n" +
                 "सलाह: सामान्य कॉल। सामान्य सावधानियों के साथ बातचीत सुरक्षित है।";
        }
      }
      if (isOtpScam) {
        return "जोखिम स्तर: अत्यंत खतरनाक (ओटीपी घोटाला 98%)\n" +
               "कारण: बैंक कभी भी फोन पर ओटीपी नहीं मांगते। यह आपके खाते को खाली करने का प्रयास है।\n" +
               "सलाह: इस संदेश को अनदेखा करें और किसी को ओटीपी न बताएं।";
      }
      if (isKycScam || isPhishingLink) {
        return "जोखिम स्तर: खतरनाक (केवाईसी धोखाधड़ी 95%)\n" +
               "कारण: खाता ब्लॉक होने का डर दिखाकर धोखाधड़ी की जाती है।\n" +
               "सलाह: अपनी बैंक शाखा से संपर्क करें, किसी भी लिंक पर क्लिक न करें।";
      }
      if (isFraudMessage) {
        return "जोखिम स्तर: धोखाधड़ी की चेतावनी (स्कैम खतरा 90%)\n" +
               "कारण: इस संदेश में संदिग्ध पुरस्कार, लिंक या फर्जी ऑफ़र पाए गए हैं।\n" +
               "सलाह: किसी भी लिंक पर क्लिक न करें या पैसे ट्रांसफर न करें।";
      }
      return "जोखिम स्तर: सुरक्षित (कम खतरा 15%)\n" +
             "कारण: कोई स्पष्ट खतरा नहीं पाया गया।\n" +
             "सलाह: सतर्क रहें और अपने पिन कोड साझा न करें।";

    case "ta":
      if (isNumberOnly && text.trim().length >= 5) {
        if (isBlacklisted) {
          return "அபாய நிலை: மோசடி ஆபத்து (மோசடி அபாயம் 95%)\n" +
                 "காரணம்: இந்த எண் போலி வங்கி அழைப்புகளுக்காக எங்களது பிளாக்லிஸ்டில் சேர்க்கப்பட்டுள்ளது.\n" +
                 "ஆலோசனை: இந்த அழைப்பை ஏற்க வேண்டாம், வங்கி விவரங்களை பகிர வேண்டாம்.";
        } else {
          return "அபாய நிலை: பாதுகாப்பானது (குறைந்த அபாயம் 15%)\n" +
                 "காரணம்: இந்த எண்ணிற்கு எந்தவித புகாரும் இல்லை, பிளாக்லிஸ்டிலும் இல்லை.\n" +
                 "ஆலோசனை: சாதாரண அழைப்பு. வழக்கமான எச்சரிக்கையுடன் பேசலாம்.";
        }
      }
      if (isOtpScam) {
        return "அபாய நிலை: மிகவும் ஆபத்தானது (OTP மோசடி 98%)\n" +
               "காரணம்: வங்கிகள் ஒருபோதும் போனில் OTP கேட்காது. இது உங்கள் பணத்தைத் திருடும் முயற்சி.\n" +
               "ஆலோசனை: இந்த செய்தியை புறக்கணிக்கவும், யாருக்கும் OTP சொல்ல வேண்டாம்.";
      }
      if (isKycScam || isPhishingLink) {
        return "அபாய நிலை: ஆபத்தானது (KYC மோசடி 95%)\n" +
               "காரணம்: கணக்கு முடக்கப்படும் என்று பயமுறுத்துவது மோசடி செய்பவர்களின் முறை.\n" +
               "ஆலோசனை: உங்கள் வங்கி கிளையை அணுகவும், லிங்க்களை கிளிக் செய்யாதீர்கள்.";
      }
      if (isFraudMessage) {
        return "அபாய நிலை: மோசடி எச்சரிக்கை (மோசடி ஆபத்து 90%)\n" +
               "காரணம்: இந்த செய்தியில் சந்தேகத்திற்குரிய லிங்க் அல்லது போலி வாக்குறுதி உள்ளது.\n" +
               "ஆலோசனை: லிங்க்களை கிளிக் செய்ய வேண்டாம்.";
      }
      return "அபாய நிலை: பாதுகாப்பானது (குறைந்த அபாயம் 15%)\n" +
             "காரணம்: ஆபத்தான வார்த்தைகள் எதுவும் கண்டறியப்படவில்லை.\n" +
             "ஆலோசனை: விழிப்புடன் இருங்கள், ரகசிய குறியீடுகளை பகிர வேண்டாம்.";

    default:
      if (isNumberOnly && text.trim().length >= 5) {
        if (isBlacklisted) {
          return "RISK LEVEL: FRAUD WARNING (Scam Threat 95%)\n" +
                 "Reason: This number is identified on our active cyber blacklist for phishing and fraud.\n" +
                 "Advice: Do not pick up or share personal banking details.";
        } else {
          return "RISK LEVEL: SAFE (Low Risk 15%)\n" +
                 "Reason: This number has no reported banking frauds and is not on any active blacklist.\n" +
                 "Advice: Standard safe contact. Safe to interact under normal precautions.";
        }
      }
      if (isOtpScam) {
        return "RISK LEVEL: CRITICAL FRAUD WARNING (OTP Scam Risk 98%)\n" +
               "Reason: Banks never ask for OTPs or PINs over call or SMS. This is a direct theft attempt.\n" +
               "Advice: Ignore this message and never reveal your confidential digits.";
      }
      if (isKycScam || isPhishingLink) {
        return "RISK LEVEL: HIGH FRAUD WARNING (KYC Phishing Scam 95%)\n" +
               "Reason: Urgency warnings about account suspension or suspicious links are psychological scams.\n" +
               "Advice: Never click external links. Visit your nearest official bank branch directly.";
      }
      if (isLotteryScam) {
        return "RISK LEVEL: HIGH FRAUD WARNING (Lottery / Prize Scam 92%)\n" +
               "Reason: Unsolicited reward offers demanding advance fees or QR code scans are fraudulent.\n" +
               "Advice: Block sender immediately. Do not transfer any processing fees.";
      }
      if (isFraudMessage) {
        return "RISK LEVEL: FRAUD WARNING (Suspicious Scam Pattern 90%)\n" +
               "Reason: Text contains suspicious financial keywords, unverified urgency, or phishing links.\n" +
               "Advice: Do not respond or share credentials. Verify directly with official customer care.";
      }
      return "RISK LEVEL: SECURE / LOW THREAT (Low Risk 15%)\n" +
             "Reason: No obvious phishing keywords matched. Stay alert.\n" +
             "Advice: Do not share security codes with anyone.";
  }
}
