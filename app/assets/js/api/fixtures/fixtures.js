/**
 * FIXTURES — Données mock basées sur SEED_DATA.md (marqué A-06)
 * ------------------------------------------------------------------
 * Toutes les données sont des données de démonstration clairement
 * identifiées, conformes au SEED_DATA du cahier des charges.
 * Aucune donnée réelle n'est affichée.
 *
 * Préfixes documentés :
 * - matricules 202600xx
 * - références DEM-2026-xxxxx, DOC-2026-xxxxx, REC-2026-xxxxx
 * - codes d'activation ACT-xxxxxx
 */

export const institution = {
  nom: 'Smart Campus DZ — La plateforme algérienne intelligente pour la vie universitaire',
  nom_ar: 'سمارت كامبس دي زي — المنصة الجزائرية الذكية للحياة الجامعية',
  site: 'smartcampus.dz',
  adresse_ar: 'الجزائر العاصمة، الجزائر',
  adresse_fr: 'Alger, Algérie',
  telephone: '+213 (0) 46 00 00 00',
  email: 'contact@smartcampus.dz'
};

export const facultes = [
  { id: 1, nom_ar: 'كلية العلوم والتكنولوجيا', nom_fr: 'Faculté des Sciences et Technologie', nom_en: 'Faculty of Sciences and Technology', type: 'faculte', actif: true,
    departements: [
      { id: 5, nom_ar: 'قسم الهندسة الكهربائية', nom_fr: 'Département Génie Électrique',
        specialites: [
          { id: 9, nom_ar: 'ليسانس — هندسة كهربائية', nom_fr: 'Licence Génie Électrique', niveau: 'licence' }
        ]
      },
      { id: 6, nom_ar: 'قسم الهندسة الميكانيكية', nom_fr: 'Département Génie Mécanique',
        specialites: [
          { id: 10, nom_ar: 'ماستر — هندسة ميكانيكية', nom_fr: 'Master Génie Mécanique', niveau: 'master' }
        ]
      }
    ]
  },
  { id: 2, nom_ar: 'كلية الحقوق والعلوم السياسية', nom_fr: 'Faculté de Droit et Sciences Politiques', nom_en: 'Faculty of Law and Political Sciences', type: 'faculte', actif: true,
    departements: [
      { id: 7, nom_ar: 'قسم القانون الخاص', nom_fr: 'Département Droit Privé',
        specialites: [
          { id: 11, nom_ar: 'ليسانس — قانون', nom_fr: 'Licence Droit', niveau: 'licence' }
        ]
      }
    ]
  },
  { id: 3, nom_ar: 'كلية العلوم الاقتصادية والتجارية وعلوم التسيير', nom_fr: 'Faculté des Sciences Économiques, Commerciales et Sciences de Gestion', nom_en: 'Faculty of Economics, Commerce and Management', type: 'faculte', actif: true, departements: [] },
  { id: 4, nom_ar: 'المعهد الوطني المتخصص في التكوين المهني', nom_fr: 'Institut National Spécialisé de Formation Professionnelle', nom_en: 'National Specialized Institute of Vocational Training', type: 'institut', actif: true,
    departements: [
      { id: 8, nom_ar: 'قسم الإعلام الآلي', nom_fr: 'Département Informatique',
        specialites: [
          { id: 12, nom_ar: 'تقني سامي في الإعلام الآلي — قواعد بيانات', nom_fr: 'Technicien Supérieur en Informatique — Bases de données', niveau: 'autre' }
        ]
      }
    ]
  }
];

export const services = [
  { id: 21, code: 'bourse', nom_ar: 'المنح الطلابية', nom_fr: 'Bourses', nom_en: 'Scholarships', actif: true,
    description_ar: 'طلب منحة جامعية، تتبع الملف، الاطلاع على القرار',
    description_fr: 'Demande de bourse universitaire, suivi du dossier et notification de la décision',
    icon: 'wallet'
  },
  { id: 22, code: 'hebergement', nom_ar: 'الإقامة الجامعية', nom_fr: 'Hébergement', nom_en: 'Housing', actif: true,
    description_ar: 'طلب الإقامة في السكن الجامعي، اختيار نوع الغرفة والمدة',
    description_fr: 'Demande de logement en résidence universitaire, choix du type de chambre et de la durée',
    icon: 'home'
  },
  { id: 23, code: 'transport', nom_ar: 'النقل الجامعي', nom_fr: 'Transport', nom_en: 'Transport', actif: true,
    description_ar: 'معلومات خطوط النقل الجامعي والتوقيتات، بلاغات وتحديثات',
    description_fr: 'Informations sur les lignes de transport universitaire, horaires et annonces',
    icon: 'bus'
  },
  { id: 24, code: 'restauration', nom_ar: 'المطعم الجامعي', nom_fr: 'Restauration', nom_en: 'Catering', actif: true,
    description_ar: 'معلومات المطعم الجامعي، التوقيتات والقوائم، ملاحظات وشكاوى',
    description_fr: 'Informations sur le restaurant universitaire, horaires, menus et remarques',
    icon: 'utensils'
  },
  { id: 25, code: 'sante', nom_ar: 'الصحة الجامعية', nom_fr: 'Santé', nom_en: 'Health', actif: true,
    description_ar: 'طلب موعد استشارة طبية، تتبع الموعد، الاطلاع على الإعلانات الصحية',
    description_fr: 'Demande de rendez-vous médical, suivi du créneau et annonces sanitaires',
    icon: 'heart'
  },
  { id: 26, code: 'scolarite', nom_ar: 'الوثائق الإدارية', nom_fr: 'Scolarité', nom_en: 'Administrative documents', actif: false,
    description_ar: 'طلب وثيقة إدارية: شهادة مدرسية، انتظام، كشف نقاط',
    description_fr: 'Demande de document administratif: attestation, certificat, relevé',
    icon: 'file-text'
  }
];

export const documentTypes = [
  { id: 35, code: 'attestation_scolarite', libelle_ar: 'شهادة مدرسية', libelle_fr: 'Attestation de scolarité', libelle_en: 'Certificate of enrolment', service_id: 26, actif: true },
  { id: 36, code: 'certificat_inscription', libelle_ar: 'شهادة انتظام', libelle_fr: 'Certificat d\'inscription', libelle_en: 'Certificate of registration', service_id: 26, actif: true },
  { id: 37, code: 'releve_notes', libelle_ar: 'كشف نقاط', libelle_fr: 'Relevé de notes', libelle_en: 'Transcript of records', service_id: 26, actif: true }
];

export const actualites = [
  { id: 122, type: 'officielle', categorie: 'actualite',
    titre_ar: 'السنة الجامعية 2026-2027 تنطلق',
    titre_fr: 'Rentrée universitaire 2026-2027',
    titre_en: 'Academic year 2026-2027',
    contenu_ar: 'استقبلت الجامعة اليوم صباح الطلبة الجدد بحضور كامل أسرة الجامعة. تنطلق فعاليات السنة الجامعية 2026-2027 رسمياً في جميع الكليات والمعاهد، مع برنامج استقبال وتأطير خاص بالطلبة المستجدين.',
    contenu_fr: 'La nouvelle année académique a débuté ce matin en présence de toute la famille universitaire. Les activités de l\'année 2026-2027 démarrent officiellement dans toutes les facultés et l\'institut, avec un programme d\'accueil et d\'encadrement spécial pour les nouveaux étudiants.',
    contenu_en: null,
    image_chemin: null,
    publie_le: '2026-09-15T08:00:00Z',
    date_evenement: null
  },
  { id: 124, type: 'officielle', categorie: 'evenement',
    titre_ar: 'يوم علمي حول الذكاء الاصطناعي',
    titre_fr: 'Journée scientifique sur l\'IA',
    titre_en: null,
    contenu_ar: 'ينظم المعهد يوماً علمياً حول تطبيقات الذكاء الاصطناعي يوم 25/11 في المدرج الكبير. ستتضمن الفعالية محاضرات افتتاحية وورشات تطبيقية مفتوحة للطلبة والأساتذة.',
    contenu_fr: 'L\'institut organise une journée scientifique sur les applications de l\'intelligence artificielle le 25/11 dans le grand amphithéâtre. L\'événement comprendra des conférences inaugurales et des ateliers pratiques ouverts aux étudiants et enseignants.',
    contenu_en: null,
    image_chemin: null,
    publie_le: '2026-11-10T10:00:00Z',
    date_evenement: '2026-11-25'
  },
  { id: 123, type: 'officielle', categorie: 'annonce',
    titre_ar: 'إعلان فتح خدمة الإقامة للتسجيلات',
    titre_fr: null, // test règle 7 — champ manquant
    titre_en: null,
    contenu_ar: 'تُفتح تسجيلات الإقامة الجامعية اعتباراً من الغد عبر فضاء الطالب. على الطلبة الراغبين في الاستفادة من خدمة الإقامة تقديم طلباتهم قبل تاريخ الإغلاق المحدد.',
    contenu_fr: null, contenu_en: null,
    image_chemin: null,
    publie_le: '2026-09-20T09:00:00Z',
    date_evenement: null
  },
  { id: 125, type: 'officielle', categorie: 'annonce',
    titre_ar: 'فتح تسجيلات السنة الأولى',
    titre_fr: 'Ouverture des inscriptions en première année',
    titre_en: 'First-year enrolment open',
    contenu_ar: 'تُفتح تسجيلات الطلبة المستجدين للسنة الأولى ابتداءً من 1 سبتمبر عبر المنصة الوطنية Progres.',
    contenu_fr: 'Les inscriptions des nouveaux étudiants en première année ouvrent à partir du 1er septembre via la plateforme nationale Progres.',
    contenu_en: 'Enrolment for new first-year students opens from September 1st via the national Progres platform.',
    image_chemin: null,
    publie_le: '2026-08-25T08:00:00Z',
    date_evenement: null
  }
];

export const liensExternes = [
  { id: 140, libelle_ar: 'المنظومة الوطنية Progres', libelle_fr: 'Système national Progres', url: 'https://progres.mesrs.dz', ordre: 1, actif: true },
  { id: 141, libelle_ar: 'التعليم عن بعد e-Learning', libelle_fr: 'Plateforme e-Learning', url: 'https://elearning.smartcampus.dz', ordre: 2, actif: true },
  { id: 142, libelle_ar: 'المكتبة الرقمية', libelle_fr: 'Bibliothèque numérique', url: 'https://biblio.smartcampus.dz', ordre: 3, actif: true },
  { id: 143, libelle_ar: 'الوزارة MESRS', libelle_fr: 'Ministère MESRS', url: 'https://www.mesrs.dz', ordre: 4, actif: true }
];

// --- Utilisateurs (basés sur SEED_DATA §3) ---
// Mots de passe de démo (jamais exposés côté client en production) :
//   etudiants : "etudiant2026"
//   employes  : "employe2026"
//   admin     : "admin2026"
//   enseignant: "enseignant2026"
export const utilisateurs = [
  { id: 41, identifiant: 'admin', nom_ar: 'حمدي', prenom_ar: 'عبد الرحمان', nom: 'Hamdi', prenom: 'Abderrahmane', email: 'admin@smartcampus.dz', role: 'admin', statut: 'actif', langue_pref: 'ar' },
  { id: 42, identifiant: 'emp.heb', nom_ar: 'بوشامة', prenom_ar: 'أمل', nom: 'Bouchama', prenom: 'Amel', email: 'a.bouchama@smartcampus.dz', role: 'employe', statut: 'actif', langue_pref: 'fr', service_id: 22, service_nom_ar: 'الإقامة الجامعية', service_nom_fr: 'Hébergement' },
  { id: 43, identifiant: 'emp.bourse', nom_ar: 'زياني', prenom_ar: 'سفّيان', nom: 'Ziani', prenom: 'Sofiane', email: 's.ziani@smartcampus.dz', role: 'employe', statut: 'actif', langue_pref: 'fr', service_id: 21, service_nom_ar: 'المنح الطلابية', service_nom_fr: 'Bourses' },
  { id: 44, identifiant: 'emp.sante', nom_ar: 'مرابط', prenom_ar: 'حورية', nom: 'Merabet', prenom: 'Houria', email: 'h.merabet@smartcampus.dz', role: 'employe', statut: 'actif', langue_pref: 'ar', service_id: 25, service_nom_ar: 'الصحة الجامعية', service_nom_fr: 'Santé' },
  { id: 45, identifiant: 'ens.kerdjoudj', nom_ar: 'كرجودج', prenom_ar: 'كريم', nom: 'Kerdjoudj', prenom: 'Karim', email: 'k.kerdjoudj@smartcampus.dz', role: 'enseignant', statut: 'actif', langue_pref: 'ar', faculte_id: 4, departement_id: 8 },
  { id: 47, identifiant: '20260001', nom_ar: 'بلعيد', prenom_ar: 'سارة', nom: 'Belaid', prenom: 'Sara', email: null, role: 'etudiant', statut: 'actif', langue_pref: 'ar',
    specialite_id: 12, annee_etude: 1,
    faculte_ar: 'المعهد الوطني المتخصص في التكوين المهني', faculte_fr: 'Institut National Spécialisé de Formation Professionnelle',
    departement_ar: 'قسم الإعلام الآلي', departement_fr: 'Département Informatique',
    specialite_ar: 'تقني سامي في الإعلام الآلي — قواعد بيانات', specialite_fr: 'Technicien Supérieur en Informatique — Bases de données'
  },
  { id: 48, identifiant: '20260002', nom_ar: 'زروقي', prenom_ar: 'أمين', nom: 'Zerrouki', prenom: 'Amine', email: null, role: 'etudiant', statut: 'actif', langue_pref: 'ar',
    specialite_id: 12, annee_etude: 2,
    faculte_ar: 'المعهد الوطني المتخصص في التكوين المهني', faculte_fr: 'Institut National Spécialisé de Formation Professionnelle',
    departement_ar: 'قسم الإعلام الآلي', departement_fr: 'Département Informatique',
    specialite_ar: 'تقني سامي في الإعلام الآلي — قواعد بيانات', specialite_fr: 'Technicien Supérieur en Informatique — Bases de données'
  },
  { id: 52, identifiant: '20260006', nom_ar: 'بوعزة', prenom_ar: 'مهدي', nom: 'Bouazza', prenom: 'Mehdi', email: null, role: 'etudiant', statut: 'non_active', langue_pref: 'ar' },
  { id: 54, identifiant: '20260008', nom_ar: 'سعداوي', prenom_ar: 'رشيد', nom: 'Saadaoui', prenom: 'Rachid', email: null, role: 'etudiant', statut: 'desactive', langue_pref: 'ar' },
  {"id": 100, "identifiant": "222238464708", "nom": "ABCHICHE", "prenom": "Ismail", "nom_ar": "ABCHICHE", "prenom_ar": "Ismail", "email": "ismail.abchiche@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026222238464708", "nin": "100021256013550112", "date_naissance": "04-08-2002", "lieu_naissance": "Tissemsilt", "niveau": "Master 2", "cycle": "master"},
  {"id": 101, "identifiant": "222238467411", "nom": "ACHAR", "prenom": "Hadjira", "nom_ar": "ACHAR", "prenom_ar": "Hadjira", "email": "hadjira.achar@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026222238467411", "nin": "110041256005220096", "date_naissance": "22-03-2004", "lieu_naissance": "Tissemsilt", "niveau": "Master 2", "cycle": "master"},
  {"id": 102, "identifiant": "2300245114", "nom": "ADJEZ", "prenom": "Fatima", "nom_ar": "ADJEZ", "prenom_ar": "Fatima", "email": "fatima.adjez@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN380120262300245114", "nin": "5ad5e6af-58bf-48b8", "date_naissance": "27-04-1982", "lieu_naissance": "", "niveau": "Master 2", "cycle": "master"},
  {"id": 103, "identifiant": "26052061015", "nom": "AMICHE", "prenom": "Ahmed", "nom_ar": "AMICHE", "prenom_ar": "Ahmed", "email": "ahmed.amiche@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN3801202626052061015", "nin": "119871267003710000", "date_naissance": "11-05-1987", "lieu_naissance": "", "niveau": "Master 2", "cycle": "master"},
  {"id": 104, "identifiant": "171738068786", "nom": "AOMAR", "prenom": "Mourad", "nom_ar": "AOMAR", "prenom_ar": "Mourad", "email": "mourad.aomar@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026171738068786", "nin": "109951258005550000", "date_naissance": "29-09-1995", "lieu_naissance": "Bordj Bounaama  -Tissemsilt", "niveau": "Master 2", "cycle": "master"},
  {"id": 105, "identifiant": "222238480520", "nom": "BAYA", "prenom": "Abdelahamid", "nom_ar": "BAYA", "prenom_ar": "Abdelahamid", "email": "abdelahamid.baya@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026222238480520", "nin": "100041256023200112", "date_naissance": "23-12-2004", "lieu_naissance": "Tissemsilt", "niveau": "Master 2", "cycle": "master"},
  {"id": 106, "identifiant": "212138071467", "nom": "BOUCHAREB", "prenom": "Bilal", "nom_ar": "BOUCHAREB", "prenom_ar": "Bilal", "email": "bilal.bouchareb@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026212138071467", "nin": "100021258001930000", "date_naissance": "30-03-2002", "lieu_naissance": "Bordj Bounaama  -Tissemsilt", "niveau": "Master 2", "cycle": "master"},
  {"id": 107, "identifiant": "22128057102", "nom": "BOUYADRI", "prenom": "Laid", "nom_ar": "BOUYADRI", "prenom_ar": "Laid", "email": "laid.bouyadri@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN3801202622128057102", "nin": "109941260000280016", "date_naissance": "02-02-1994", "lieu_naissance": "Sidi Slimane - Tissemsilt", "niveau": "Master 2", "cycle": "master"},
  {"id": 108, "identifiant": "18088061105", "nom": "BOUZENZEL", "prenom": "Naima", "nom_ar": "BOUZENZEL", "prenom_ar": "Naima", "email": "naima.bouzenzel@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN3801202618088061105", "nin": "20088061105", "date_naissance": "24-02-1990", "lieu_naissance": "theniet el had tissemsilt", "niveau": "Master 2", "cycle": "master"},
  {"id": 109, "identifiant": "222238473611", "nom": "CHERNOUNE", "prenom": "Bouchra Imene", "nom_ar": "CHERNOUNE", "prenom_ar": "Bouchra Imene", "email": "bouchra.imene.chernoune@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026222238473611", "nin": "110031262005330096", "date_naissance": "13-08-2003", "lieu_naissance": "Theniet El Had - Tissemsilt", "niveau": "Master 2", "cycle": "master"},
  {"id": 110, "identifiant": "202038014322", "nom": "DAIMALLAH", "prenom": "Fatma Zohra", "nom_ar": "DAIMALLAH", "prenom_ar": "Fatma Zohra", "email": "fatma.zohra.daimallah@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026202038014322", "nin": "8b1f0df1-2e98-4557-b43f-7839aaf75ea3", "date_naissance": "14-03-2000", "lieu_naissance": "mahdia", "niveau": "Master 2", "cycle": "master"},
  {"id": 111, "identifiant": "171738067280", "nom": "GHALEB", "prenom": "Issam Chihab Eddine", "nom_ar": "GHALEB", "prenom_ar": "Issam Chihab Eddine", "email": "issam.chihab.eddine.ghaleb@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026171738067280", "nin": "109971256001030112", "date_naissance": "19-01-1997", "lieu_naissance": "Tissemsilt", "niveau": "Master 2", "cycle": "master"},
  {"id": 112, "identifiant": "212138070500", "nom": "GHEZAL", "prenom": "Fairouz", "nom_ar": "GHEZAL", "prenom_ar": "Fairouz", "email": "fairouz.ghezal@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026212138070500", "nin": "110031267003130000", "date_naissance": "07-07-2003", "lieu_naissance": "Lardjem - Tissemsilt", "niveau": "Master 2", "cycle": "master"},
  {"id": 113, "identifiant": "222238462308", "nom": "KHADIMI", "prenom": "Narimane", "nom_ar": "KHADIMI", "prenom_ar": "Narimane", "email": "narimane.khadimi@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026222238462308", "nin": "110021256011380096", "date_naissance": "04-07-2002", "lieu_naissance": "Tissemsilt", "niveau": "Master 2", "cycle": "master"},
  {"id": 114, "identifiant": "222238481505", "nom": "LATEB", "prenom": "Nour Elhouda Ikram", "nom_ar": "LATEB", "prenom_ar": "Nour Elhouda Ikram", "email": "nour.elhouda.ikram.lateb@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026222238481505", "nin": "110040476008610016", "date_naissance": "03-07-2004", "lieu_naissance": "Ksar Chellala -Tiaret", "niveau": "Master 2", "cycle": "master"},
  {"id": 115, "identifiant": "212139031840", "nom": "MALEG", "prenom": "Abderrahmane", "nom_ar": "MALEG", "prenom_ar": "Abderrahmane", "email": "abderrahmane.maleg@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026212139031840", "nin": "100030646025800000", "date_naissance": "02-12-2003", "lieu_naissance": "Ain ouassara-djelfa", "niveau": "Master 2", "cycle": "master"},
  {"id": 116, "identifiant": "222238475010", "nom": "MALEG", "prenom": "Safaanour El Imane", "nom_ar": "MALEG", "prenom_ar": "Safaanour El Imane", "email": "safaanour.el.imane.maleg@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026222238475010", "nin": "110041262004280112", "date_naissance": "07-07-2004", "lieu_naissance": "Theniet El Had - Tissemsilt", "niveau": "Master 2", "cycle": "master"},
  {"id": 117, "identifiant": "222238476612", "nom": "MEDJAHER", "prenom": "Hassen Nasreddine", "nom_ar": "MEDJAHER", "prenom_ar": "Hassen Nasreddine", "email": "hassen.nasreddine.medjaher@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026222238476612", "nin": "100030797004970000", "date_naissance": "13-07-2003", "lieu_naissance": "Telagh - Sidi Bel Abbès", "niveau": "Master 2", "cycle": "master"},
  {"id": 118, "identifiant": "2601246044", "nom": "MEHNOUNE", "prenom": "Aicha", "nom_ar": "MEHNOUNE", "prenom_ar": "Aicha", "email": "aicha.mehnoune@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN380120262601246044", "nin": "119791256004060112", "date_naissance": "30-03-1979", "lieu_naissance": "TISSEMSILT", "niveau": "Master 2", "cycle": "master"},
  {"id": 119, "identifiant": "222238470303", "nom": "MERZOUG", "prenom": "Achwaq Baraa", "nom_ar": "MERZOUG", "prenom_ar": "Achwaq Baraa", "email": "achwaq.baraa.merzoug@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026222238470303", "nin": "110021273003190000", "date_naissance": "09-10-2002", "lieu_naissance": "Laayoune - Tissemsilt", "niveau": "Master 2", "cycle": "master"},
  {"id": 120, "identifiant": "222238486911", "nom": "MESSAI", "prenom": "Adel", "nom_ar": "MESSAI", "prenom_ar": "Adel", "email": "adel.messai@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026222238486911", "nin": "100021271001290112", "date_naissance": "12-09-2002", "lieu_naissance": "Bordj el emir aek - Tissemsilt", "niveau": "Master 2", "cycle": "master"},
  {"id": 121, "identifiant": "19068061332", "nom": "MOHAMED CHERIF", "prenom": "Radhia", "nom_ar": "MOHAMED CHERIF", "prenom_ar": "Radhia", "email": "radhia.mohamed.cherif@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN3801202619068061332", "nin": "119891256010470096", "date_naissance": "15-07-1989", "lieu_naissance": "", "niveau": "Master 2", "cycle": "master"},
  {"id": 122, "identifiant": "222238462205", "nom": "NAIM", "prenom": "Fatma", "nom_ar": "NAIM", "prenom_ar": "Fatma", "email": "fatma.naim@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026222238462205", "nin": "110041256020860112", "date_naissance": "17-11-2004", "lieu_naissance": "tissemsilt", "niveau": "Master 2", "cycle": "master"},
  {"id": 123, "identifiant": "212138067880", "nom": "NAROUN", "prenom": "Mohamed Abdelfattah", "nom_ar": "NAROUN", "prenom_ar": "Mohamed Abdelfattah", "email": "mohamed.abdelfattah.naroun@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026212138067880", "nin": "212138067880", "date_naissance": "18-04-2003", "lieu_naissance": "tissemsilet", "niveau": "Master 2", "cycle": "master"},
  {"id": 124, "identifiant": "222238467120", "nom": "OUANDELOUS", "prenom": "Chaima", "nom_ar": "OUANDELOUS", "prenom_ar": "Chaima", "email": "chaima.ouandelous@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026222238467120", "nin": "110040337011600016", "date_naissance": "10-09-2004", "lieu_naissance": "Ain Bessem - Bouira", "niveau": "Master 2", "cycle": "master"},
  {"id": 125, "identifiant": "19128057099", "nom": "RAHEM", "prenom": "Ibrahim", "nom_ar": "RAHEM", "prenom_ar": "Ibrahim", "email": "ibrahim.rahem@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN3801202619128057099", "nin": "109931264001070000", "date_naissance": "03-05-1993", "lieu_naissance": "Lazharia - Tissemsilt", "niveau": "Master 2", "cycle": "master"},
  {"id": 126, "identifiant": "222238462312", "nom": "REBAH", "prenom": "Nour Elhouda", "nom_ar": "REBAH", "prenom_ar": "Nour Elhouda", "email": "nour.elhouda.rebah@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026222238462312", "nin": "110020445051460000", "date_naissance": "25-11-2002", "lieu_naissance": "Tiaret", "niveau": "Master 2", "cycle": "master"},
  {"id": 127, "identifiant": "222238486920", "nom": "RENANE", "prenom": "Hadjer", "nom_ar": "RENANE", "prenom_ar": "Hadjer", "email": "hadjer.renane@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026222238486920", "nin": "110030284027530000", "date_naissance": "14-04-2003", "lieu_naissance": "Blida", "niveau": "Master 2", "cycle": "master"},
  {"id": 128, "identifiant": "222238470802", "nom": "SAADAOUI", "prenom": "Hanane", "nom_ar": "SAADAOUI", "prenom_ar": "Hanane", "email": "hanane.saadaoui@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026222238470802", "nin": "110040486000330000", "date_naissance": "07-09-2004", "lieu_naissance": "Bougara - Tiaret", "niveau": "Master 2", "cycle": "master"},
  {"id": 129, "identifiant": "212138067892", "nom": "SAOULA", "prenom": "Nour El Islam", "nom_ar": "SAOULA", "prenom_ar": "Nour El Islam", "email": "nour.el.islam.saoula@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026212138067892", "nin": "100021256001800096", "date_naissance": "28-01-2002", "lieu_naissance": "Tissemsilt", "niveau": "Master 2", "cycle": "master"},
  {"id": 130, "identifiant": "26032016013", "nom": "TAMI", "prenom": "Mohammed", "nom_ar": "TAMI", "prenom_ar": "Mohammed", "email": "mohammed.tami@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN3801202626032016013", "nin": "109830047008220000", "date_naissance": "24-03-1983", "lieu_naissance": "سيدي العروسي", "niveau": "Master 2", "cycle": "master"},
  {"id": 131, "identifiant": "222238480315", "nom": "ZABOUR", "prenom": "Ahlem", "nom_ar": "ZABOUR", "prenom_ar": "Ahlem", "email": "ahlem.zabour@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026222238480315", "nin": "110041256020760096", "date_naissance": "16-11-2004", "lieu_naissance": "تيسمسيلت", "niveau": "Master 2", "cycle": "master"},
  {"id": 132, "identifiant": "222238473211", "nom": "ZOUKH", "prenom": "Nour El Houda", "nom_ar": "ZOUKH", "prenom_ar": "Nour El Houda", "email": "nour.el.houda.zoukh@etu.smartcampus.dz", "role": "etudiant", "statut": "actif", "langue_pref": "ar", "faculte_fr": "Sciences Économiques, de Gestion et Sciences Commerciales", "faculte_ar": "كلية الاقتصاد والتجارة وعلوم التسيير", "departement_fr": "Sciences commerciales", "departement_ar": "قسم العلوم التجارية", "specialite_fr": "Sciences commerciales", "specialite_ar": "علوم تجارية", "annee_etude": 2, "num_inscription": "UN38012026222238473211", "nin": "110021262005240096", "date_naissance": "19-09-2002", "lieu_naissance": "Theniet El Had - Tissemsilt", "niveau": "Master 2", "cycle": "master"}
];

export const activationCodes = [
  { code: 'ACT-9F2K4M', utilisateur_id: 52, type: 'activation', statut: 'valide', expire_le: '2026-12-14T00:00:00Z' },
  { code: 'ACT-7QX1RB', utilisateur_id: 53, type: 'activation', statut: 'valide', expire_le: '2026-12-14T00:00:00Z' },
  { code: 'RST-3PL8VD', utilisateur_id: 54, type: 'reset', statut: 'valide', expire_le: '2026-11-21T00:00:00Z' },
  { code: 'ACT-5NB2YH', utilisateur_id: 47, type: 'activation', statut: 'utilise', expire_le: '2026-12-14T00:00:00Z' }
];

// Mots de passe de démonstration (mock local uniquement)
export const mockPasswords = {
  'admin': 'admin2026',
  'emp.heb': 'employe2026',
  'emp.bourse': 'employe2026',
  'emp.sante': 'employe2026',
  'ens.kerdjoudj': 'enseignant2026',
  '20260001': 'etudiant2026',
  '20260002': 'etudiant2026',
  '222238464708': 'Etud20264708',
  '222238467411': 'Etud20267411',
  '2300245114': 'Etud20265114',
  '26052061015': 'Etud20261015',
  '171738068786': 'Etud20268786',
  '222238480520': 'Etud20260520',
  '212138071467': 'Etud20261467',
  '22128057102': 'Etud20267102',
  '18088061105': 'Etud20261105',
  '222238473611': 'Etud20263611',
  '202038014322': 'Etud20264322',
  '171738067280': 'Etud20267280',
  '212138070500': 'Etud20260500',
  '222238462308': 'Etud20262308',
  '222238481505': 'Etud20261505',
  '212139031840': 'Etud20261840',
  '222238475010': 'Etud20265010',
  '222238476612': 'Etud20266612',
  '2601246044': 'Etud20266044',
  '222238470303': 'Etud20260303',
  '222238486911': 'Etud20266911',
  '19068061332': 'Etud20261332',
  '222238462205': 'Etud20262205',
  '212138067880': 'Etud20267880',
  '222238467120': 'Etud20267120',
  '19128057099': 'Etud20267099',
  '222238462312': 'Etud20262312',
  '222238486920': 'Etud20266920',
  '222238470802': 'Etud20260802',
  '212138067892': 'Etud20267892',
  '26032016013': 'Etud20266013',
  '222238480315': 'Etud20260315',
  '222238473211': 'Etud20263211'
};

// --- Demandes (SEED_DATA §4 — couvre les 7 états) ---
export const demandes = [
  { id: 70, reference: 'DEM-2026-00001', type: 'service', service_id: 22, service_nom_ar: 'الإقامة الجامعية', service_nom_fr: 'Hébergement',
    etudiant_id: 47, etudiant_nom_ar: 'بلعيد', etudiant_prenom_ar: 'سارة', etudiant_nom: 'Belaid', etudiant_prenom: 'Sara',
    statut: 'Soumise', soumise_le: '2026-11-12T10:00:00Z', maj_le: '2026-11-12T10:00:00Z', cloturee_le: null },
  { id: 71, reference: 'DEM-2026-00002', type: 'service', service_id: 22, service_nom_ar: 'الإقامة الجامعية', service_nom_fr: 'Hébergement',
    etudiant_id: 48, etudiant_nom_ar: 'زروقي', etudiant_prenom_ar: 'أمين', etudiant_nom: 'Zerrouki', etudiant_prenom: 'Amine',
    statut: 'En attente de traitement', soumise_le: '2026-11-13T09:00:00Z', maj_le: '2026-11-13T09:05:00Z', cloturee_le: null },
  { id: 72, reference: 'DEM-2026-00003', type: 'service', service_id: 22, service_nom_ar: 'الإقامة الجامعية', service_nom_fr: 'Hébergement',
    etudiant_id: 47, etudiant_nom_ar: 'بلعيد', etudiant_prenom_ar: 'سارة', etudiant_nom: 'Belaid', etudiant_prenom: 'Sara',
    statut: 'En cours de vérification', soumise_le: '2026-11-12T08:00:00Z', maj_le: '2026-11-12T11:00:00Z', cloturee_le: null },
  { id: 73, reference: 'DEM-2026-00004', type: 'service', service_id: 21, service_nom_ar: 'المنح الطلابية', service_nom_fr: 'Bourses',
    etudiant_id: 47, etudiant_nom_ar: 'بلعيد', etudiant_prenom_ar: 'سارة', etudiant_nom: 'Belaid', etudiant_prenom: 'Sara',
    statut: 'En attente de complément', soumise_le: '2026-11-11T14:00:00Z', maj_le: '2026-11-11T16:00:00Z', cloturee_le: null },
  { id: 74, reference: 'DEM-2026-00005', type: 'service', service_id: 21, service_nom_ar: 'المنح الطلابية', service_nom_fr: 'Bourses',
    etudiant_id: 47, etudiant_nom_ar: 'بلعيد', etudiant_prenom_ar: 'سارة', etudiant_nom: 'Belaid', etudiant_prenom: 'Sara',
    statut: 'Acceptée', soumise_le: '2026-11-09T10:00:00Z', maj_le: '2026-11-09T15:00:00Z', cloturee_le: null },
  { id: 75, reference: 'DEM-2026-00006', type: 'service', service_id: 23, service_nom_ar: 'النقل الجامعي', service_nom_fr: 'Transport',
    etudiant_id: 47, etudiant_nom_ar: 'بلعيد', etudiant_prenom_ar: 'سارة', etudiant_nom: 'Belaid', etudiant_prenom: 'Sara',
    statut: 'Refusée', soumise_le: '2026-11-08T09:00:00Z', maj_le: '2026-11-08T14:00:00Z', cloturee_le: null },
  { id: 76, reference: 'DEM-2026-00007', type: 'service', service_id: 24, service_nom_ar: 'المطعم الجامعي', service_nom_fr: 'Restauration',
    etudiant_id: 47, etudiant_nom_ar: 'بلعيد', etudiant_prenom_ar: 'سارة', etudiant_nom: 'Belaid', etudiant_prenom: 'Sara',
    statut: 'Clôturée', soumise_le: '2026-11-06T08:00:00Z', maj_le: '2026-11-06T10:00:00Z', cloturee_le: '2026-11-06T10:00:00Z' },
  { id: 78, reference: 'DEM-2026-00009', type: 'document', document_type_id: 35, document_type_ar: 'شهادة مدرسية', document_type_fr: 'Attestation de scolarité',
    etudiant_id: 48, etudiant_nom_ar: 'زروقي', etudiant_prenom_ar: 'أمين', etudiant_nom: 'Zerrouki', etudiant_prenom: 'Amine',
    statut: 'En cours de vérification', soumise_le: '2026-11-13T11:00:00Z', maj_le: '2026-11-13T11:30:00Z', cloturee_le: null }
];

// Documents administratifs générés (pour PUB-16)
export const documents = [
  { reference: 'DOC-2026-00001', demande_id: 74, type_ar: 'شهادة مدرسية', type_fr: 'Attestation de scolarité', type_en: 'Certificate of enrolment',
    genere_le: '2026-11-09T15:00:00Z', etablissement_ar: 'سمارت كامبس دي زي — المنصة الجزائرية الذكية للحياة الجامعية', etablissement_fr: 'Smart Campus DZ — La plateforme algérienne intelligente pour la vie universitaire' }
];

// Notifications
export const notifications = [
  { id: 130, utilisateur_id: 47, type: 'changement_statut', titre_ar: 'تم استلام طلبك DEM-2026-00001', titre_fr: 'Demande DEM-2026-00001 reçue', contenu_ar: 'طلب الإقامة قيد التسجيل.', contenu_fr: 'Demande d\'hébergement enregistrée.', entite_type: 'demande', entite_id: 70, lu: false, cree_le: '2026-11-12T10:00:00Z' },
  { id: 131, utilisateur_id: 47, type: 'complement', titre_ar: 'وثائق تكميلية مطلوبة — DEM-2026-00004', titre_fr: 'Documents complémentaires requis — DEM-2026-00004', contenu_ar: 'يرجى إرفاق مقتطف الميلاد.', contenu_fr: 'Veuillez joindre l\'extrait de naissance.', entite_type: 'demande', entite_id: 73, lu: false, cree_le: '2026-11-11T16:00:00Z' },
  { id: 132, utilisateur_id: 47, type: 'decision', titre_ar: 'قرار قبول — DEM-2026-00005', titre_fr: 'Décision d\'acceptation — DEM-2026-00005', contenu_ar: 'طلب المنحة مقبول.', contenu_fr: 'Demande de bourse acceptée.', entite_type: 'demande', entite_id: 74, lu: false, cree_le: '2026-11-09T15:00:00Z' },
  { id: 133, utilisateur_id: 47, type: 'decision', titre_ar: 'قرار رفض — DEM-2026-00006', titre_fr: 'Décision de refus — DEM-2026-00006', contenu_ar: 'راجع تفاصيل الطلب لسبب الرفض.', contenu_fr: 'Consultez le détail pour le motif du refus.', entite_type: 'demande', entite_id: 75, lu: true, cree_le: '2026-11-08T14:00:00Z' }
];

// Journal d'activité
export const journal = [
  { id: 1, utilisateur_id: 41, action: 'creation_compte', entite: 'utilisateur', entite_id: 44, details: 'Compte employé santé créé (délégation D-11)', ip: '10.0.0.11', cree_le: '2026-10-15T08:30:00Z' },
  { id: 2, utilisateur_id: 42, action: 'refus', entite: 'demande', entite_id: 75, details: 'Motif: hors condition de transport', ip: '10.0.0.22', cree_le: '2026-11-08T14:00:00Z' },
  { id: 3, utilisateur_id: 43, action: 'complement', entite: 'demande', entite_id: 73, details: 'Extrait de naissance demandé', ip: '10.0.0.23', cree_le: '2026-11-11T16:00:00Z' },
  { id: 4, utilisateur_id: 41, action: 'import_etudiants', entite: 'etudiant', entite_id: null, details: '8 étudiants importés, 0 échecs', ip: '10.0.0.11', cree_le: '2026-10-12T10:00:00Z' }
];

// Ressources pédagogiques (pour ENS-00)
export const ressources = [
  { id: 110, titre: 'قواعد البيانات — الفصل الأول', titre_fr: 'Bases de données — Chapitre 1', type: 'cours', module_id: 15, enseignant_id: 45, taille_octets: 3840000, cree_le: '2026-10-01T10:00:00Z', actif: true },
  { id: 111, titre: 'TD n°1 — Normalisation', titre_fr: 'TD n°1 — Normalisation', type: 'td', module_id: 15, enseignant_id: 45, taille_octets: 980000, cree_le: '2026-10-05T09:00:00Z', actif: true },
  { id: 112, titre: 'TP — Circuits série/parallèle', titre_fr: 'TP — Circuits série/parallèle', type: 'tp', module_id: 14, enseignant_id: 46, taille_octets: 2100000, cree_le: '2026-10-08T14:00:00Z', actif: true }
];

// Annonces pédagogiques (pour ENS-03)
export const annonces = [
  { id: 200, type: 'pedagogique', titre_ar: 'بداية سلسلة TD في قواعد البيانات', titre_fr: 'Démarrage de la série de TD en bases de données',
    contenu_ar: 'نبدأ هذا الأسبوع سلسلة الأعمال الموجهة في قواعد البيانات. يُرجى من الطلبة الاطلاع على الفصل الأول قبل الحضور.',
    contenu_fr: 'Nous démarrons cette semaine la série de TD en bases de données. Les étudiants sont priés de consulter le chapitre 1 avant de venir.',
    module_id: 15, enseignant_id: 45, publie_le: '2026-10-02T08:00:00Z', actif: true }
];
