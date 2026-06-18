/**
 * Medical Metric Simplification Utility
 * Translates technical clinical terms and values into patient-friendly language.
 */

const DICTIONARY = {
  English: {
    "LDL Cholesterol": {
      simpleName: "Bad Cholesterol (LDL)",
      explanation: "This cholesterol can build up in your blood vessels, which might narrow them over time.",
      tip: "Try adding oats, beans, and healthy fats (like olive oil) to your diet, and limit fried foods."
    },
    "HDL Cholesterol": {
      simpleName: "Good Cholesterol (HDL)",
      explanation: "This helper cholesterol clears away other harmful fats from your bloodstream.",
      tip: "Keep active! Daily brisk walks and eating walnuts/seeds can help boost your good cholesterol."
    },
    "Total Cholesterol": {
      simpleName: "Total Cholesterol",
      explanation: "The total amount of cholesterol circulating in your bloodstream.",
      tip: "Maintain a balanced diet rich in vegetables, fruits, and lean proteins."
    },
    "Triglycerides": {
      simpleName: "Triglycerides (Blood Fats)",
      explanation: "A type of fat stored in your blood. High levels can impact cardiovascular health.",
      tip: "Try reducing refined sugar, sodas, alcohol, and white flour products."
    },
    "TSH (Thyroid Stimulating)": {
      simpleName: "Thyroid Stimulating Hormone (TSH)",
      explanation: "High levels indicate your thyroid is working too slowly (underactive), which can cause tiredness.",
      tip: "Consult your doctor. If you take thyroid medication, they may check if the dose needs adjusting."
    },
    "Free T4": {
      simpleName: "Thyroid Hormone (Free T4)",
      explanation: "The primary hormone active in your thyroid system. Normal values are reassuring.",
      tip: "Keep monitoring along with your TSH levels as recommended by your physician."
    },
    "25-Hydroxy Vitamin D": {
      simpleName: "Vitamin D",
      explanation: "Crucial for strong bones, calcium absorption, and maintaining robust immunity.",
      tip: "Try getting 10-15 minutes of midday sun, eat eggs/fish, or ask your doctor about a supplement."
    },
    "Serum Creatinine": {
      simpleName: "Creatinine (Kidney Waste)",
      explanation: "A natural muscle waste product. Slightly elevated levels suggest kidneys are filtering a bit slowly.",
      tip: "Drink plenty of water and avoid taking too many pain relievers like ibuprofen."
    },
    "Blood Urea Nitrogen (BUN)": {
      simpleName: "BUN (Kidney Waste)",
      explanation: "A byproduct of protein breakdown. Elevated levels can simply point to mild dehydration.",
      tip: "Increase your daily water intake. If you eat a very high-protein diet, this number can also rise."
    },
    "eGFR (Estimated GFR)": {
      simpleName: "eGFR (Kidney Filter Efficiency)",
      explanation: "A score measuring kidney filtering speed. A lower score suggests your kidneys are under mild strain.",
      tip: "Hydrate well (2.5 to 3 liters daily), limit salty foods, and discuss kidney care with your doctor."
    },
    "Alanine Aminotransferase (ALT)": {
      simpleName: "ALT (Liver Health Marker)",
      explanation: "A liver enzyme. Elevated levels indicate mild liver cell stress or irritation.",
      tip: "Limit alcohol, refined sugars, and saturated fats to support liver recovery."
    },
    "Aspartate Aminotransferase (AST)": {
      simpleName: "AST (Liver/Muscle Health Marker)",
      explanation: "An enzyme in liver and muscle. Higher levels suggest your liver is working extra hard.",
      tip: "Incorporate antioxidant-rich green tea, berries, and cruciferous vegetables like broccoli."
    },
    "White Blood Cell (WBC)": {
      simpleName: "White Blood Cells (Immune Cells)",
      explanation: "Your body's defense cells. Higher levels suggest they are actively fighting a bug or inflammation.",
      tip: "Rest well, drink warm fluids, and consult a doctor if you experience fever or pain."
    },
    "Red Blood Cell (RBC)": {
      simpleName: "Red Blood Cells (Oxygen Carriers)",
      explanation: "Cells that carry oxygen from your lungs to the rest of your body.",
      tip: "Ensure a nutrient-rich diet with vitamin B12 and folate (green leafy veggies)."
    },
    "Hemoglobin": {
      simpleName: "Hemoglobin (Oxygen Protein)",
      explanation: "The protein that binds oxygen in your blood. Low levels can lead to fatigue or anemia.",
      tip: "Incorporate iron-rich spinach or lentils, and eat them with vitamin C (citrus) to boost absorption."
    },
    "Platelet Count": {
      simpleName: "Platelets (Clotting Cells)",
      explanation: "Cells that help blood clot to stop bleeding. Low levels can cause easy bruising.",
      tip: "Report any unusual bleeding, nosebleeds, or easy bruising to your healthcare provider."
    },
    "Refractive Error (OD)": {
      simpleName: "Right Eye Vision (OD)",
      explanation: "Your right eye's vision rating. Indicates nearsightedness or farsightedness.",
      tip: "Use the 20-20-20 rule: look 20 feet away for 20 seconds every 20 minutes of screen time."
    },
    "Refractive Error (OS)": {
      simpleName: "Left Eye Vision (OS)",
      explanation: "Your left eye's vision rating. Indicates nearsightedness or farsightedness.",
      tip: "Ensure comfortable lighting when reading and get regular eye examinations."
    },
    "HbA1c": {
      simpleName: "HbA1c (3-Month Blood Sugar)",
      explanation: "Your average blood sugar over the last 90 days. Higher levels indicate prediabetes signs.",
      tip: "Reduce sweet foods and refined carbs. A 10-minute walk after meals helps manage blood sugar."
    },
    "Blood Glucose": {
      simpleName: "Blood Glucose (Sugar)",
      explanation: "The amount of sugar in your blood. Elevated levels suggest insulin sensitivity changes.",
      tip: "Focus on complex carbs (whole oats, brown rice) and try to get regular daily activity."
    }
  },
  Hindi: {
    "LDL Cholesterol": {
      simpleName: "खराब कोलेस्ट्रॉल (LDL)",
      explanation: "यह आपकी रक्त वाहिकाओं में जमा हो सकता है, जिससे वे समय के साथ संकरी हो सकती हैं।",
      tip: "आहार में ओट्स, बीन्स और जैतून का तेल शामिल करें। तले-भुने भोजन से बचें।"
    },
    "HDL Cholesterol": {
      simpleName: "अच्छा कोलेस्ट्रॉल (HDL)",
      explanation: "यह मददगार कोलेस्ट्रॉल रक्त से अन्य हानिकारक वसा को साफ करता है।",
      tip: "सक्रिय रहें! रोजाना टहलने और अखरोट/बीज खाने से इसे बढ़ाने में मदद मिलती है।"
    },
    "Total Cholesterol": {
      simpleName: "कुल कोलेस्ट्रॉल",
      explanation: "आपके रक्तप्रवाह में बहने वाले कोलेस्ट्रॉल की कुल मात्रा।",
      tip: "सब्जियों, फलों और कम वसा वाले प्रोटीन से भरपूर संतुलित आहार लें।"
    },
    "Triglycerides": {
      simpleName: "ट्राइग्लिसराइड्स (रक्त वसा)",
      explanation: "रक्त में जमा वसा का एक प्रकार। उच्च स्तर हृदय स्वास्थ्य को प्रभावित कर सकता है।",
      tip: "मीठा, सोडा, शराब और मैदे से बनी चीजों को कम करने का प्रयास करें।"
    },
    "TSH (Thyroid Stimulating)": {
      simpleName: "थायरॉयड उत्तेजक हार्मोन (TSH)",
      explanation: "उच्च स्तर का अर्थ है कि आपका थायरॉयड ग्रंथि धीमी गति से काम कर रही है, जिससे थकान हो सकती है।",
      tip: "डॉक्टर से मिलें। यदि आप थायरॉयड की दवा ले रहे हैं, तो खुराक की जांच कराएं।"
    },
    "Free T4": {
      simpleName: "थायरॉयड हार्मोन (Free T4)",
      explanation: "आपके थायरॉयड सिस्टम में सक्रिय मुख्य हार्मोन। सामान्य मान होना अच्छी बात है।",
      tip: "डॉक्टर की सलाह के अनुसार अपने TSH स्तर के साथ इसकी भी निगरानी रखें।"
    },
    "25-Hydroxy Vitamin D": {
      simpleName: "विटामिन डी",
      explanation: "मजबूत हड्डियों, कैल्शियम को सोखने और रोग प्रतिरोधक क्षमता के लिए बहुत आवश्यक है।",
      tip: "रोज 10-15 मिनट धूप लें, अंडा/मछली खाएं, या पूरक (सप्लीमेंट) के लिए डॉक्टर से पूछें।"
    },
    "Serum Creatinine": {
      simpleName: "क्रिएटिनिन (किडनी का कचरा)",
      explanation: "मांसपेशियों का वेस्ट। बढ़ा हुआ स्तर बताता है कि किडनी थोड़ा धीरे फिल्टर कर रही है।",
      tip: "खूब पानी पिएं और इबुप्रोफेन जैसी दर्द निवारक दवाओं का अत्यधिक उपयोग न करें।"
    },
    "Blood Urea Nitrogen (BUN)": {
      simpleName: "BUN (किडनी का कचरा)",
      explanation: "प्रोटीन टूटने का उपोत्पाद। बढ़ा हुआ स्तर शरीर में पानी की कमी (dehydration) का संकेत हो सकता है।",
      tip: "पानी पीना बढ़ाएं। यदि आप बहुत अधिक प्रोटीन वाला भोजन लेते हैं, तो भी यह बढ़ सकता है।"
    },
    "eGFR (Estimated GFR)": {
      simpleName: "किडनी फिल्टर क्षमता (eGFR)",
      explanation: "किडनी की छानने की गति। कम स्कोर का मतलब है कि किडनी पर हल्का दबाव है।",
      tip: "खूब पानी पिएं (रोज 2.5-3 लीटर), नमक कम खाएं और डॉक्टर से सलाह लें।"
    },
    "Alanine Aminotransferase (ALT)": {
      simpleName: "ALT (लिवर स्वास्थ्य संकेतक)",
      explanation: "ALT लिवर एंजाइम। बढ़ा हुआ स्तर लिवर कोशिकाओं में हल्की सूजन या तनाव का संकेत देता है।",
      tip: "लिवर को आराम देने के लिए शराब, चीनी और संतृप्त वसा (saturated fats) कम लें।"
    },
    "Aspartate Aminotransferase (AST)": {
      simpleName: "AST (लिवर/मांसपेशी संकेतक)",
      explanation: "लिवर और मांसपेशियों का एंजाइम। बढ़ा स्तर बताता है कि लिवर अतिरिक्त मेहनत कर रहा है।",
      tip: "एंटीऑक्सीडेंट युक्त ग्रीन टी लें, जामुन (berries) खाएं और ब्रोकली जैसी सब्जियां लें।"
    },
    "White Blood Cell (WBC)": {
      simpleName: "सफेद रक्त कोशिकाएं (प्रतिरक्षा कोशिकाएं)",
      explanation: "शरीर की रक्षा कोशिकाएं। बढ़ा हुआ स्तर बताता है कि वे किसी संक्रमण या सूजन से लड़ रही हैं।",
      tip: "अच्छे से आराम करें, पानी पिएं और बुखार या दर्द होने पर डॉक्टर से संपर्क करें।"
    },
    "Red Blood Cell (RBC)": {
      simpleName: "लाल रक्त कोशिकाएं (ऑक्सीजन वाहक)",
      explanation: "कोशिकाएं जो आपके फेफड़ों से शरीर के बाकी हिस्सों तक ऑक्सीजन ले जाती हैं।",
      tip: "विटामिन बी12 और फोलेट (हरी पत्तेदार सब्जियां) से भरपूर आहार लें।"
    },
    "Hemoglobin": {
      simpleName: "हीमोग्लोबिन (ऑक्सीजन प्रोटीन)",
      explanation: "रक्त में ऑक्सीजन ले जाने वाला मुख्य प्रोटीन। कम स्तर से थकान या एनीमिया हो सकता है।",
      tip: "पालक या दालें लें और आयरन सोखने में सुधार के लिए नींबू या संतरा साथ में लें।"
    },
    "Platelet Count": {
      simpleName: "प्लेटलेट्स (थक्का जमाने वाली कोशिकाएं)",
      explanation: "रक्त बहने से रोकने वाली कोशिकाएं। कम स्तर से आसानी से चोट या खून बह सकता है।",
      tip: "शरीर पर नीले निशान (bruising) या मसूड़ों से खून आने पर तुरंत डॉक्टर को दिखाएं।"
    },
    "Refractive Error (OD)": {
      simpleName: "दाहिनी आंख की दृष्टि (OD)",
      explanation: "आपकी दाहिनी आंख की दृष्टि। निकट या दूर दृष्टिदोष को दर्शाती है।",
      tip: "20-20-20 नियम अपनाएं: स्क्रीन देखते समय हर 20 मिनट में 20 सेकंड के लिए 20 फीट दूर देखें।"
    },
    "Refractive Error (OS)": {
      simpleName: "बाईं आंख की दृष्टि (OS)",
      explanation: "आपकी बाईं आंख की दृष्टि। निकट या दूर दृष्टिदोष को दर्शाती है।",
      tip: "पढ़ते समय रोशनी अच्छी रखें और नियमित रूप से आंखों की जांच कराएं।"
    },
    "HbA1c": {
      simpleName: "HbA1c (3 महीने की चीनी का औसत)",
      explanation: "पिछले 90 दिनों में औसत रक्त शर्करा। उच्च स्तर प्री-डायबिटीज का संकेत देता है।",
      tip: "मीठा और रिफाइंड कार्ब्स कम करें। भोजन के बाद 10 मिनट टहलना रक्त शर्करा नियंत्रित करता है।"
    },
    "Blood Glucose": {
      simpleName: "ब्लड ग्लूकोज (चीनी)",
      explanation: "आपके रक्त में शर्करा की मात्रा। बढ़ा हुआ स्तर इंसुलिन संवेदनशीलता में कमी बताता है।",
      tip: "जटिल कार्ब्स (दलिया, भूरे चावल) लें और रोजाना शारीरिक गतिविधि करें।"
    }
  },
  Spanish: {
    "LDL Cholesterol": {
      simpleName: "Colesterol Malo (LDL)",
      explanation: "Este colesterol puede acumularse en los vasos sanguíneos, reduciendo su flujo con el tiempo.",
      tip: "Agregue avena, legumbres y grasas saludables (como aceite de oliva) y limite los alimentos fritos."
    },
    "HDL Cholesterol": {
      simpleName: "Colesterol Bueno (HDL)",
      explanation: "Este colesterol ayuda a eliminar otras grasas dañinas de su torrente sanguíneo.",
      tip: "¡Manténgase activo! Las caminatas diarias y comer nueces ayudan a elevar el colesterol bueno."
    },
    "Total Cholesterol": {
      simpleName: "Colesterol Total",
      explanation: "La cantidad total de colesterol que circula en su torrente sanguíneo.",
      tip: "Mantenga una dieta equilibrada rica en verduras, frutas y proteínas magras."
    },
    "Triglycerides": {
      simpleName: "Triglicéridos (Grasas en Sangre)",
      explanation: "Un tipo de grasa en sangre. Niveles altos pueden afectar su salud cardiovascular.",
      tip: "Intente reducir el azúcar refinado, los refrescos, el alcohol y las harinas blancas."
    },
    "TSH (Thyroid Stimulating)": {
      simpleName: "Hormona Estimulante de la Tiroides (TSH)",
      explanation: "Niveles altos sugieren que su tiroides trabaja lento (hipotiroidismo), causando fatiga.",
      tip: "Consulte a su médico. Si ya toma hormona tiroidea, podrían requerir ajustar la dosis."
    },
    "Free T4": {
      simpleName: "Hormona Tiroidea (T4 Libre)",
      explanation: "La hormona tiroidea activa principal. Los valores normales son una señal tranquilizadora.",
      tip: "Continúe monitoreando junto con sus niveles de TSH según lo recomiende su médico."
    },
    "25-Hydroxy Vitamin D": {
      simpleName: "Vitamina D",
      explanation: "Crucial para los huesos fuertes, la absorción del calcio y un sistema inmune robusto.",
      tip: "Tome 10-15 minutos de sol al mediodía, coma huevos/pescado o consulte por un suplemento."
    },
    "Serum Creatinine": {
      simpleName: "Creatinina (Desecho Renal)",
      explanation: "Desecho muscular normal. Niveles altos indican que los riñones filtran un poco más lento.",
      tip: "Beba abundante agua y evite el uso excesivo de analgésicos como el ibuprofeno."
    },
    "Blood Urea Nitrogen (BUN)": {
      simpleName: "BUN (Desecho Renal)",
      explanation: "Subproducto de la descomposición de proteínas. Puede elevarse por deshidratación leve.",
      tip: "Aumente el consumo de agua. Dietas muy altas en proteínas también pueden elevar este valor."
    },
    "eGFR (Estimated GFR)": {
      simpleName: "eGFR (Eficiencia del Filtro Renal)",
      explanation: "Mide qué tan bien filtran los riñones. Una puntuación baja indica una leve tensión.",
      tip: "Hidrátese bien (2.5 a 3 litros al día), limite la sal y consulte con su especialista."
    },
    "Alanine Aminotransferase (ALT)": {
      simpleName: "ALT (Salud del Hígado)",
      explanation: "Una enzima hepática. Niveles altos sugieren estrés o inflamación celular leve en el hígado.",
      tip: "Evite el alcohol, azúcares refinados y grasas saturadas para permitir que el hígado se recupere."
    },
    "Aspartate Aminotransferase (AST)": {
      simpleName: "AST (Salud Hepática/Muscular)",
      explanation: "Enzima presente en hígado y músculos. Valores elevados sugieren trabajo hepático extra.",
      tip: "Consuma té verde, bayas y verduras crucíferas (como el brócoli) ricas en antioxidantes."
    },
    "White Blood Cell (WBC)": {
      simpleName: "Glóbulos Blancos (Células Inmunes)",
      explanation: "Células de defensa. Niveles altos indican que luchan activamente contra una infección.",
      tip: "Descanse bien, manténgase hidratado y visite al médico si presenta fiebre o dolor."
    },
    "Red Blood Cell (RBC)": {
      simpleName: "Glóbulos Rojos (Transportadores)",
      explanation: "Células que transportan el oxígeno por todo su cuerpo.",
      tip: "Asegure una dieta rica en nutrientes con vitamina B12 y ácido fólico (verduras verdes)."
    },
    "Hemoglobin": {
      simpleName: "Hemoglobina (Proteína de Oxígeno)",
      explanation: "La proteína que fija el oxígeno. Niveles bajos pueden provocar cansancio o anemia.",
      tip: "Consuma espinacas o lentejas y acompáñelas con vitamina C (cítricos) para absorber el hierro."
    },
    "Platelet Count": {
      simpleName: "Plaquetas (Coagulación)",
      explanation: "Células que detienen el sangrado. Niveles bajos pueden provocar moretones fácilmente.",
      tip: "Informe cualquier sangrado inusual o moretones sin explicación a su médico."
    },
    "Refractive Error (OD)": {
      simpleName: "Visión del Ojo Derecho (OD)",
      explanation: "Graduación del ojo derecho. Indica miopía o hipermetropía.",
      tip: "Aplique la regla 20-20-20: desvíe la mirada a 6 metros por 20 segundos cada 20 minutos de pantalla."
    },
    "Refractive Error (OS)": {
      simpleName: "Visión del Ojo Izquierdo (OS)",
      explanation: "Graduación del ojo izquierdo. Indica miopía o hipermetropía.",
      tip: "Asegúrese de leer con buena luz y asista a sus exámenes de la vista regularmente."
    },
    "HbA1c": {
      simpleName: "HbA1c (Promedio de Azúcar)",
      explanation: "Promedio de azúcar en sangre de los últimos 90 días. Niveles altos indican prediabetes.",
      tip: "Evite los dulces y harinas refinadas. Caminar 10 minutos tras comer ayuda a reducir el azúcar."
    },
    "Blood Glucose": {
      simpleName: "Glucosa (Azúcar en Sangre)",
      explanation: "Nivel de azúcar circulante. Elevaciones sugieren resistencia a la insulina inicial.",
      tip: "Prefiera carbohidratos complejos (avena integral, arroz integral) y manténgase activo."
    }
  },
  French: {
    "LDL Cholesterol": {
      simpleName: "Mauvais Cholestérol (LDL)",
      explanation: "Ce cholestérol peut s'accumuler dans vos artères et les rétrécir à long terme.",
      tip: "Ajoutez de l'avoine, des haricots et de l'huile d'olive à vos repas, et évitez le frit."
    },
    "HDL Cholesterol": {
      simpleName: "Bon Cholestérol (HDL)",
      explanation: "Ce bon cholestérol aide à éliminer les graisses nocives de votre circulation sanguine.",
      tip: "Restez actif! La marche rapide quotidienne et les noix augmentent le bon cholestérol."
    },
    "Total Cholesterol": {
      simpleName: "Cholestérol Total",
      explanation: "La quantité globale de cholestérol circulant dans votre sang.",
      tip: "Privilégiez un régime équilibré riche en légumes, fruits et protéines maigres."
    },
    "Triglycerides": {
      simpleName: "Triglycérides (Graisses du Sang)",
      explanation: "Graisses stockées dans le sang. Un taux élevé peut peser sur la santé cardiovasculaire.",
      tip: "Réduisez le sucre raffiné, les boissons sucrées, l'alcool et les produits à base de farine blanche."
    },
    "TSH (Thyroid Stimulating)": {
      simpleName: "TSH (Hormone Thyroïdienne)",
      explanation: "Une TSH élevée indique que la thyroïde tourne au ralenti, causant de la fatigue.",
      tip: "Consultez. Si vous êtes sous Levothyrox, votre médecin devra peut-être adapter le dosage."
    },
    "Free T4": {
      simpleName: "Hormone T4 Libre",
      explanation: "L'hormone thyroïdienne active principale. Un taux normal est très rassurant.",
      tip: "Continuez la surveillance combinée de la TSH et de la T4 selon l'avis de votre médecin."
    },
    "25-Hydroxy Vitamin D": {
      simpleName: "Vitamine D",
      explanation: "Cruciale pour la solidité osseuse, l'assimilation du calcium et l'immunité.",
      tip: "Prenez le soleil 10-15 min à la mi-journée, mangez des œufs/poissons ou complémentez."
    },
    "Serum Creatinine": {
      simpleName: "Créatinine (Déchet Rénal)",
      explanation: "Déchet de l'activité musculaire. Un taux élevé montre un léger ralentissement du filtre rénal.",
      tip: "Hydratez-vous bien et limitez la prise d'anti-inflammatoires comme l'ibuprofène."
    },
    "Blood Urea Nitrogen (BUN)": {
      simpleName: "Urée (BUN - Déchet Rénal)",
      explanation: "Issu de la dégradation des protéines. Peut s'élever en cas de légère déshydratation.",
      tip: "Buvez plus d'eau. Un régime hyperprotéiné peut également faire monter ce marqueur."
    },
    "eGFR (Estimated GFR)": {
      simpleName: "DFG (Capacité de Filtration)",
      explanation: "Indique l'efficacité de vos reins. Un score bas traduit une légère fatigue rénale.",
      tip: "Buvez 2.5 à 3 litres d'eau par jour, réduisez le sel et faites le point avec votre médecin."
    },
    "Alanine Aminotransferase (ALT)": {
      simpleName: "ALAT (Santé du Foie)",
      explanation: "Enzyme du foie. Une hausse indique un stress ou une irritation des cellules du foie.",
      tip: "Limitez l'alcool, le sucre et les graisses saturées pour laisser reposer votre foie."
    },
    "Aspartate Aminotransferase (AST)": {
      simpleName: "ASAT (Santé Foie/Muscles)",
      explanation: "Enzyme présente dans le foie et les muscles. Son élévation montre un effort du foie.",
      tip: "Consommez du thé vert, des baies et des crucifères (comme les brocolis) riches en antioxydants."
    },
    "White Blood Cell (WBC)": {
      simpleName: "Globules Blancs (Immunité)",
      explanation: "Vos cellules de défense. Un taux élevé indique qu'elles combattent un virus ou une inflammation.",
      tip: "Reposez-vous, buvez chaud et consultez si vous avez de la fièvre ou des douleurs."
    },
    "Red Blood Cell (RBC)": {
      simpleName: "Globules Rouges (Oxygène)",
      explanation: "Cellules chargées de distribuer l'oxygène de vos poumons à tout le corps.",
      tip: "Mangez des aliments riches en vitamine B12 et en folates (légumes verts à feuilles)."
    },
    "Hemoglobin": {
      simpleName: "Hémoglobine (Protéine d'Oxygène)",
      explanation: "Protéine fixant l'oxygène. Un taux bas engendre fatigue ou anémie.",
      tip: "Consommez des lentilles ou épinards associés à de la vitamine C (citron) pour mieux fixer le fer."
    },
    "Platelet Count": {
      simpleName: "Plaquettes (Coagulation)",
      explanation: "Cellules empêchant les saignements. Un taux bas peut causer des bleus facilement.",
      tip: "Signalez tout bleu inexpliqué ou saignement de nez persistant à votre médecin."
    },
    "Refractive Error (OD)": {
      simpleName: "Vision Œil Droit (OD)",
      explanation: "Correction de l'œil droit, mesurant la myopie ou l'hypermétropie.",
      tip: "Suivez la règle 20-20-20 : regardez à 6 mètres pendant 20 sec toutes les 20 min d'écran."
    },
    "Refractive Error (OS)": {
      simpleName: "Vision Œil Gauche (OS)",
      explanation: "Correction de l'œil gauche, mesurant la myopie ou l'hypermétropie.",
      tip: "Lisez sous une bonne lumière et effectuez des bilans ophtalmologiques réguliers."
    },
    "HbA1c": {
      simpleName: "HbA1c (Moyenne du Glycémie)",
      explanation: "Moyenne du sucre sur 90 jours. Un taux élevé indique un état prédiabétique.",
      tip: "Évitez le sucre rapide. Une marche de 10 min après le repas aide à faire baisser le glucose."
    },
    "Blood Glucose": {
      simpleName: "Glycémie (Sucre Sanguin)",
      explanation: "Taux de sucre instantané. Une hausse indique un début de résistance à l'insuline.",
      tip: "Privilégiez les sucres lents (avoine entière, riz complet) et bougez un peu tous les jours."
    }
  },
  German: {
    "LDL Cholesterol": {
      simpleName: "Schlechtes Cholesterin (LDL)",
      explanation: "Dieses Cholesterin kann sich in den Gefäßen ablagern und diese langfristig verengen.",
      tip: "Essen Sie mehr Haferflocken, Bohnen und Olivenöl, und meiden Sie frittierte Speisen."
    },
    "HDL Cholesterol": {
      simpleName: "Gutes Cholesterin (HDL)",
      explanation: "Dieses schützende Cholesterin transportiert Fettablagerungen aus den Adern ab.",
      tip: "Bleiben Sie aktiv! Bewegung und Walnüsse helfen, das gute Cholesterin zu steigern."
    },
    "Total Cholesterol": {
      simpleName: "Gesamtcholesterin",
      explanation: "Die Gesamtmenge an Cholesterin, die in Ihrem Blut zirkuliert.",
      tip: "Achten Sie auf eine ausgewogene Ernährung mit viel Gemüse, Obst und magerem Eiweiß."
    },
    "Triglycerides": {
      simpleName: "Triglyceride (Blutfette)",
      explanation: "Eine im Blut gespeicherte Fettart. Hohe Werte belasten das Herz-Kreislauf-System.",
      tip: "Reduzieren Sie Haushaltszucker, Limonaden, Alkohol und Weißmehlprodukte."
    },
    "TSH (Thyroid Stimulating)": {
      simpleName: "Schilddrüsenwert (TSH)",
      explanation: "Ein hoher TSH zeigt, dass die Schilddrüse zu langsam arbeitet (Unterfunktion), was müde macht.",
      tip: "Arztbesuch ratsam. Bei Medikamenteneinnahme muss eventuell die Dosis angepasst werden."
    },
    "Free T4": {
      simpleName: "Freies T4 (Schilddrüsenhormon)",
      explanation: "Das aktive Haupt-Schilddrüsenhormon. Normale Werte sind ein gutes Zeichen.",
      tip: "Überwachen Sie den Wert wie vom Arzt empfohlen zusammen mit dem TSH-Wert."
    },
    "25-Hydroxy Vitamin D": {
      simpleName: "Vitamin D",
      explanation: "Wichtig für die Knochendichte, die Aufnahme von Kalzium und ein starkes Immunsystem.",
      tip: "Gehen Sie täglich 10-15 Min. in die Sonne, essen Sie Fisch/Eier oder nehmen Sie Tropfen."
    },
    "Serum Creatinine": {
      simpleName: "Kreatinin (Nierenwert)",
      explanation: "Abbauprodukt der Muskeln. Erhöhte Werte deuten auf eine verlangsamte Nierenfilterung hin.",
      tip: "Trinken Sie ausreichend Wasser und meiden Sie Schmerzmittel wie Ibuprofen."
    },
    "Blood Urea Nitrogen (BUN)": {
      simpleName: "BUN (Harnstoff - Nierenwert)",
      explanation: "Abfallstoff des Eiweißabbaus. Kann durch leichten Flüssigkeitsmangel erhöht sein.",
      tip: "Trinken Sie mehr Wasser. Eine sehr eiweißreiche Ernährung lässt diesen Wert ebenfalls steigen."
    },
    "eGFR (Estimated GFR)": {
      simpleName: "eGFR (Nierenfilter-Effizienz)",
      explanation: "Zeigt, wie gut Ihre Nieren filtern. Niedrigere Werte zeigen eine leichte Belastung.",
      tip: "Trinken Sie täglich 2,5 bis 3 Liter Wasser, reduzieren Sie Salz und sprechen Sie mit Ihrem Arzt."
    },
    "Alanine Aminotransferase (ALT)": {
      simpleName: "ALT (Leberwert)",
      explanation: "Ein Enzym der Leber. Erhöhte Werte deuten auf eine leichte Reizung der Leberzellen hin.",
      tip: "Meiden Sie Alkohol, Zucker und gesättigte Fette, um die Leber zu entlasten."
    },
    "Aspartate Aminotransferase (AST)": {
      simpleName: "AST (Leber-/Muskelenzym)",
      explanation: "Enzym in Leber und Muskeln. Ein erhöhter Wert zeigt eine Beanspruchung der Leber.",
      tip: "Trinken Sie grünen Tee, essen Sie Beeren und Kreuzblütler-Gemüse wie Brokkoli."
    },
    "White Blood Cell (WBC)": {
      simpleName: "Weiße Blutkörperchen (Abwehrzellen)",
      explanation: "Ihre Immunzellen. Erhöhte Werte deuten auf eine aktive Bekämpfung eines Infekts hin.",
      tip: "Gönnen Sie sich Ruhe, trinken Sie viel Wasser und gehen Sie bei Fieber zum Arzt."
    },
    "Red Blood Cell (RBC)": {
      simpleName: "Rote Blutkörperchen (Sauerstoffträger)",
      explanation: "Zellen, die den Sauerstoff von der Lunge in den Körper transportieren.",
      tip: "Achten Sie auf eine nährstoffreiche Ernährung mit Vitamin B12 und Folsäure (grünes Gemüse)."
    },
    "Hemoglobin": {
      simpleName: "Hämoglobin (Blutfarbstoff)",
      explanation: "Das sauerstoffbindende Protein im Blut. Niedrige Werte führen zu Müdigkeit (Anämie).",
      tip: "Essen Sie eisenreiche Lebensmittel (Spinat, Linsen) zusammen mit Vitamin C für eine bessere Aufnahme."
    },
    "Platelet Count": {
      simpleName: "Blutplättchen (Thrombozyten)",
      explanation: "Zellen zur Blutstillung. Niedrige Werte können schneller zu blauen Flecken führen.",
      tip: "Melden Sie unklare blaue Flecken oder häufiges Nasenbluten Ihrem Arzt."
    },
    "Refractive Error (OD)": {
      simpleName: "Sehkraft Rechtes Auge (OD)",
      explanation: "Die Dioptrien-Messung Ihres rechten Auges (Kurz- oder Weitsichtigkeit).",
      tip: "Nutzen Sie die 20-20-20-Regel: Blicken Sie alle 20 Min. für 20 Sek. in 20 Fuß (ca. 6m) Entfernung."
    },
    "Refractive Error (OS)": {
      simpleName: "Sehkraft Linkes Auge (OS)",
      explanation: "Die Dioptrien-Messung Ihres linken Auges (Kurz- oder Weitsichtigkeit).",
      tip: "Sorgen Sie für gutes Leselicht und lassen Sie Ihre Augen regelmäßig kontrollieren."
    },
    "HbA1c": {
      simpleName: "HbA1c (Langzeit-Blutzucker)",
      explanation: "Ihr durchschnittlicher Blutzucker der letzten 90 Tage. Erhöht bei Prädiabetes.",
      tip: "Meiden Sie Süßigkeiten. Ein 10-minütiger Spaziergang nach dem Essen senkt den Blutzucker."
    },
    "Blood Glucose": {
      simpleName: "Blutzucker (Glucose)",
      explanation: "Der aktuelle Zuckergehalt im Blut. Ein erhöhter Wert deutet auf verringerte Insulinsensitivität hin.",
      tip: "Bevorzugen Sie komplexe Kohlenhydrate (Haferflocken, Vollkornreis) und bewegen Sie sich täglich."
    }
  }
}

const FALLBACKS = {
  English: {
    explanation: "This lab marker is slightly outside the standard reference range.",
    tip: "Discuss this marker with your primary care physician to understand its significance in your health journey."
  },
  Hindi: {
    explanation: "यह लैब संकेतक सामान्य सीमा से थोड़ा बाहर है।",
    tip: "अपने डॉक्टर से इस बारे में चर्चा करें ताकि इसके महत्व को समझा जा सके।"
  },
  Spanish: {
    explanation: "Este marcador de laboratorio está ligeramente fuera del rango de referencia estándar.",
    tip: "Consulte a su médico de cabecera para comprender su significado en su salud."
  },
  French: {
    explanation: "Ce marqueur biologique est légèrement en dehors des valeurs de référence standard.",
    tip: "Consultez votre médecin traitant pour en comprendre la signification pour votre santé."
  },
  German: {
    explanation: "Dieser Laborwert liegt leicht außerhalb des Standard-Referenzbereichs.",
    tip: "Besprechen Sie diesen Wert mit Ihrem Hausarzt, um seine Bedeutung für Ihre Gesundheit zu verstehen."
  }
}

/**
 * Normalizes a metric name to match a known key in our dictionary.
 */
function getMatchingKey(metricName) {
  if (!metricName) return null
  const n = metricName.toLowerCase()
  if (n.includes("ldl")) return "LDL Cholesterol"
  if (n.includes("hdl")) return "HDL Cholesterol"
  if (n.includes("total cholesterol")) return "Total Cholesterol"
  if (n.includes("triglycerides") || n.includes("triglyceride")) return "Triglycerides"
  if (n.includes("tsh") || n.includes("thyroid stimulating")) return "TSH (Thyroid Stimulating)"
  if (n.includes("free t4")) return "Free T4"
  if (n.includes("vitamin d") || n.includes("hydroxy vitamin d")) return "25-Hydroxy Vitamin D"
  if (n.includes("creatinine")) return "Serum Creatinine"
  if (n.includes("bun") || n.includes("urea nitrogen")) return "Blood Urea Nitrogen (BUN)"
  if (n.includes("egfr") || n.includes("gfr")) return "eGFR (Estimated GFR)"
  if (n.includes("alt") || n.includes("alanine aminotransferase")) return "Alanine Aminotransferase (ALT)"
  if (n.includes("ast") || n.includes("aspartate aminotransferase")) return "Aspartate Aminotransferase (AST)"
  if (n.includes("wbc") || n.includes("white blood cell")) return "White Blood Cell (WBC)"
  if (n.includes("rbc") || n.includes("red blood cell")) return "Red Blood Cell (RBC)"
  if (n.includes("hemoglobin") || n.includes("hb")) return "Hemoglobin"
  if (n.includes("platelet")) return "Platelet Count"
  if (n.includes("od") && n.includes("refractive")) return "Refractive Error (OD)"
  if (n.includes("os") && n.includes("refractive")) return "Refractive Error (OS)"
  if (n.includes("hba1c")) return "HbA1c"
  if (n.includes("glucose") || n.includes("sugar")) return "Blood Glucose"
  return null
}

/**
 * Simplifies a technical medical metric for display on the patient dashboard.
 * @param {string} metricName Raw technical name (e.g. "Alanine Aminotransferase (ALT)")
 * @param {string} status Raw clinical status (e.g. "Mildly Elevated (Ref: 10 - 40)")
 * @param {string|number} value Raw value (e.g. 54)
 * @param {string} unit Raw unit (e.g. "U/L")
 * @param {string} language Preferred language (English, Hindi, Spanish, French, German)
 * @returns {object} Simplified details containing simpleName, explanation, and tip.
 */
export function simplifyMetric(metricName, status, value, unit, language = 'English') {
  const lang = DICTIONARY[language] ? language : 'English'
  const key = getMatchingKey(metricName)

  const langDict = DICTIONARY[lang]
  const langFallback = FALLBACKS[lang]

  if (key && langDict[key]) {
    return {
      simpleName: langDict[key].simpleName,
      explanation: langDict[key].explanation,
      tip: langDict[key].tip
    }
  }

  // Fallback if metric is custom / not found in our pre-mapped list
  return {
    simpleName: metricName, // Keep original technical name
    explanation: langFallback.explanation,
    tip: langFallback.tip
  }
}
