export interface PreguntaEscala {
  id: string;
  seccionId: string;
  pregunta: string;
  versiculo: string;
  descripcion?: string;
  minLabel?: string;
  maxLabel?: string;
}

export interface DonEspiritual {
  numero: number;
  nombre: string;
  nombreAlternativo?: string;
  parrafo: string;
  versiculo: string;
  ministeriosRecomendados: string;
  estudioBiblicoRecomendado: string;
  consejosPracticos: string;
  color: string;
  icono: string;
}

export interface SeccionEvaluacion {
  id: string;
  titulo: string;
  versiculoRef: string;
  textoBiblico: string;
  preguntas?: PreguntaEscala[];
  esDones?: boolean;
  esDiligenciaTexto?: boolean;
}

export const DONES_ROMANOS_12: Record<number, DonEspiritual> = {
  1: {
    numero: 1,
    nombre: "Misericordia",
    parrafo:
      "Me identifico profundamente con las personas que sufren, percibo sus necesidades físicas y emocionales, y siento una motivación especial para consolarlas, aliviar su sufrimiento y ayudarlas a sanar, procurando tratarlas con sensibilidad y comprensión.",
    versiculo: "Romanos 12:8b (\"el que hace misericordia, con alegría\")",
    ministeriosRecomendados:
      "Es importante relacionarte con los ministerios de ayuda comunitaria, evangelismo o los grupos de visitas e intercesión o cualquier espacio donde puedas ayudar a la gente necesitada física y espiritual.",
    estudioBiblicoRecomendado:
      "Estudia en la Biblia la forma correcta de ministrar a quienes sufren estando en momentos de angustia (ej. compasión de Cristo, consolación del Espíritu Santo).",
    consejosPracticos:
      "Ejerce tu don siempre con alegría y sensibilidad, cuidando no desgastarte emocionalmente al descansar en la soberanía de Dios.",
    color: "#ec4899",
    icono: "❤️"
  },
  2: {
    numero: 2,
    nombre: "Dar (Generosidad)",
    parrafo:
      "Siento satisfacción al compartir mis recursos económicos y materiales para satisfacer necesidades y apoyar proyectos o ministerios eficaces, procurando administrar sabiamente lo que tengo y dar generosamente, incluso cuando nadie lo sabe o reconoce.",
    versiculo: "Romanos 12:8a (\"el que reparte, con liberalidad\")",
    ministeriosRecomendados:
      "Es importante relacionarte con los ministerios de ayuda comunitaria, familia, finanzas y el ministerio pastoral de la iglesia a fin de ofrecer tus recursos para cubrir necesidades y apoyar los proyectos de la iglesia que requieren inversión tanto económica como de otros recursos que estés dispuesto a compartir y a dar.",
    estudioBiblicoRecomendado:
      "Estudia en la Biblia cómo honrar a Dios con tus bienes a través de todos los proyectos que la iglesia emprenda (ej. mayordomía fiel, liberalidad sincera).",
    consejosPracticos:
      "Da con sencillez y alegría en secreto, sabiendo que Dios ama al dador alegre y que Él es tu proveedor continuo.",
    color: "#10b981",
    icono: "🎁"
  },
  3: {
    numero: 3,
    nombre: "Liderazgo (Presidir)",
    parrafo:
      "Me nace asumir responsabilidades, organizar personas y recursos, establecer objetivos, planificar los pasos para alcanzarlos y dar seguimiento a las tareas, procurando que los demás trabajen coordinadamente y que los proyectos se completen eficazmente.",
    versiculo: "Romanos 12:8a (\"el que preside, con solicitud\")",
    ministeriosRecomendados:
      "Es importante relacionarte con las directivas de los diferentes departamentos, ministerios y grupos de la iglesia a fin de ponerte a disposición para servir en cualquier área que se te requiera. Aporta con tus ideas e involúcrate con humildad para servir a los demás con agrado y excelencia.",
    estudioBiblicoRecomendado:
      "Estudia la mayordomía bíblica y el liderazgo cristiano de siervo según el modelo de Jesús (ej. Marcos 10:45, Nehemías).",
    consejosPracticos:
      "Busca la mejor manera de cómo servir a los demás sin esperar nada a cambio, liderando siempre con diligencia y solicitud de corazón.",
    color: "#6366f1",
    icono: "👑"
  },
  4: {
    numero: 4,
    nombre: "Aconsejar (Exhortación)",
    parrafo:
      "Me motiva ayudar a las personas a crecer espiritualmente mediante la orientación personal, la aplicación práctica de las verdades bíblicas y el ánimo para enfrentar sus dificultades, tomar decisiones sabias y convertir sus convicciones en acciones concretas.",
    versiculo: "Romanos 12:8a (\"el que exhorta, en la exhortación\")",
    ministeriosRecomendados:
      "Es importante relacionarte con el departamento de familia y Escuela Bíblica y con los grupos o ministerios que llevan a cabo el ministerio privado de la iglesia y acompañamiento pastoral.",
    estudioBiblicoRecomendado:
      "Aconsejar requiere un conocimiento profundo de la Biblia aplicado a necesidades muy específicas y una muestra de amor genuina por cada creyente que enfrenta un momento de crisis o necesita instrucción para crecer en su vida.",
    consejosPracticos:
      "Acompaña a las personas con paciencia y verdad en amor, guiándolas siempre a Cristo y nunca a tu propia opinión.",
    color: "#8b5cf6",
    icono: "🧭"
  },
  5: {
    numero: 5,
    nombre: "Enseñar",
    parrafo:
      "Disfruto investigar, estudiar y comprobar las verdades bíblicas, comprenderlas correctamente y explicarlas de manera clara, ordenada y fiel a su contexto, procurando que otros adquieran conocimiento sólido y puedan comprender lo que enseño.",
    versiculo: "Romanos 12:7b (\"el que enseña, en la enseñanza\")",
    ministeriosRecomendados:
      "Es importante relacionarte con el departamento de Educación Cristiana, Escuela Bíblica y cualquier grupo o ministerio que lleve a cabo el ministerio público de la iglesia.",
    estudioBiblicoRecomendado:
      "Enseñar requiere un conocimiento profundo de la Biblia aplicado a necesidades generales de los creyentes y requiere habilidades tanto hermenéuticas como pedagógicas todo con la finalidad de formar a los creyentes a la imagen de Cristo.",
    consejosPracticos:
      "Prepárate continuamente en sana doctrina y pedagogía bíblica, viviendo primero lo que enseñas a la grey.",
    color: "#0284c7",
    icono: "📖"
  },
  6: {
    numero: 6,
    nombre: "Servicio (Diaconía)",
    parrafo:
      "Estoy atento a las necesidades prácticas que otros pueden pasar por alto y siento satisfacción al atenderlas con diligencia, iniciativa y disposición, procurando completar las tareas necesarias, apoyar a quienes tienen responsabilidades y contribuir al buen funcionamiento de la obra, aunque mi labor no sea reconocida.",
    versiculo: "Romanos 12:7a (\"si de servicio, en servir\")",
    ministeriosRecomendados:
      "Es importante relacionarte con el ministerio de Servidores (ujieres / protocolo / logística) o cualquier grupo o ministerio de la iglesia. En todas las áreas de la iglesia se requiere de creyentes dispuestos a colaborar todos los días con la expansión del Reino de Dios haciendo todo tipo de tareas.",
    estudioBiblicoRecomendado:
      "Estudia el servicio desinteresado y la diaconía bíblica (Hechos 6, 1 Timoteo 3).",
    consejosPracticos:
      "Los Servidores no solo requieren tener la actitud correcta de servicio, sino estar preparados para desempeñar con excelencia el servicio que se demanda de ellos, por lo que deben especializarse constantemente en su área de servicio.",
    color: "#f59e0b",
    icono: "🤝"
  },
  7: {
    numero: 7,
    nombre: "Profecía (Proclamación de la Verdad)",
    parrafo:
      "Siento una fuerte motivación por comunicar y defender las verdades de Dios con claridad, firmeza y convicción, identificar lo que contradice sus principios y llamar a otros a vivir de acuerdo con la Palabra, incluso cuando hacerlo implique confrontar errores o enfrentar críticas.",
    versiculo: "Romanos 12:6b (\"si el de profecía, úsese conforme a la medida de la fe\")",
    ministeriosRecomendados:
      "Es importante relacionarte con los ministerios de enseñanza de la iglesia, en especial con el Departamento de Evangelismo y el Pilar de la Adoración de la iglesia.",
    estudioBiblicoRecomendado:
      "Predicar la Palabra y ser usado por Dios para llevar su mensaje requiere una búsqueda profunda del rostro de Dios y una llenura del Espíritu Santo en el día a día, y sobre todo, la capacidad de escuchar la voz de Dios a través de su Palabra haciendo uso de una correcta interpretación.",
    consejosPracticos:
      "Habla la verdad siempre sazonada con gracia y amor redentor, evitando la dureza o el orgullo espiritual.",
    color: "#ef4444",
    icono: "🔥"
  }
};

export const SECCIONES_EVALUACION: SeccionEvaluacion[] = [
  {
    id: "sec_v1",
    titulo: "1. Sacrificio Vivo y Culto Racional",
    versiculoRef: "Romanos 12:1",
    textoBiblico:
      "Así que, hermanos, os ruego por las misericordias de Dios, que presentéis vuestros cuerpos en sacrificio vivo, santo, agradable a Dios, que es vuestro culto racional.",
    preguntas: [
      {
        id: "p_v1_1",
        seccionId: "sec_v1",
        versiculo: "Romanos 12:1",
        pregunta: "¿Hasta qué punto te consideras a ti mismo como una ofrenda agradable ante Dios?",
        minLabel: "1 - Muy lejos / No me considero así",
        maxLabel: "10 - Totalmente consagrado como ofrenda"
      },
      {
        id: "p_v1_2",
        seccionId: "sec_v1",
        versiculo: "Romanos 12:1",
        pregunta: "¿Hasta qué punto eres consciente de que todo lo que haces es parte de tu culto al Señor?",
        minLabel: "1 - Raras veces consciente",
        maxLabel: "10 - Plena conciencia constante en todo"
      },
      {
        id: "p_v1_3",
        seccionId: "sec_v1",
        versiculo: "Romanos 12:1",
        pregunta:
          "¿Qué tan consciente eres de vivir una vida de santidad apartada del pecado ante Dios ya que sabes no te debes a ti mismo sino sólo a Él?",
        minLabel: "1 - Muy descuidado",
        maxLabel: "10 - Fuerte convicción y búsqueda de santidad"
      },
      {
        id: "p_v1_4",
        seccionId: "sec_v1",
        versiculo: "Romanos 12:1",
        pregunta:
          "¿Qué tanto estás dispuesto a sacrificar tu cuerpo, tu tiempo, recursos, talentos, bienestar o comodidad, con tal de ser esa ofrenda de olor fragante ante Dios?",
        minLabel: "1 - Me cuesta mucho sacrificar",
        maxLabel: "10 - Totalmente dispuesto al sacrificio por Dios"
      },
      {
        id: "p_v1_5",
        seccionId: "sec_v1",
        versiculo: "Romanos 12:1",
        pregunta:
          "¿Qué tan consciente estás de ser un instrumento de adoración rendido ante el Señor, antes que el Señor un instrumento medio para perseguir tu propia finalidad?",
        minLabel: "1 - Busco mis propios fines en Dios",
        maxLabel: "10 - Totalmente rendido a la gloria de Dios"
      }
    ]
  },
  {
    id: "sec_v2",
    titulo: "2. Renovación del Entendimiento y Voluntad de Dios",
    versiculoRef: "Romanos 12:2",
    textoBiblico:
      "No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento, para que comprobéis cuál sea la buena voluntad de Dios, agradable y perfecta.",
    preguntas: [
      {
        id: "p_v2_1",
        seccionId: "sec_v2",
        versiculo: "Romanos 12:2",
        pregunta:
          "¿Hasta qué punto las convicciones de tu corazón son el resultado de mirar al Señor o ver las tendencias que te ofrece este mundo?",
        minLabel: "1 - Moldeado por el mundo",
        maxLabel: "10 - Cimentado firmemente en el Señor"
      },
      {
        id: "p_v2_2",
        seccionId: "sec_v2",
        versiculo: "Romanos 12:2",
        pregunta:
          "¿Es tu consumo diario de contenido una actividad consciente para conocer más a Dios a través de los medios que Él te ha dejado y el resultado de lo que te ofrecen los algoritmos de las redes sociales o las tendencias y noticias que hay en el mundo?",
        minLabel: "1 - Absorbido por algoritmos y noticias",
        maxLabel: "10 - Filtrado y enfocado conscientemente en Dios"
      },
      {
        id: "p_v2_3",
        seccionId: "sec_v2",
        versiculo: "Romanos 12:2",
        pregunta:
          "¿Está tu entendimiento lleno del evangelio de Jesucristo para renovarte en el cada día o está lleno de los intereses y preocupaciones que te presenta este mundo?",
        minLabel: "1 - Lleno de afanes e intereses del mundo",
        maxLabel: "10 - Saturado del evangelio de Jesucristo"
      },
      {
        id: "p_v2_4",
        seccionId: "sec_v2",
        versiculo: "Romanos 12:2",
        pregunta:
          "¿Qué tan comprometido y consciente estás de renovar tus ideas y pensamientos a la luz de Cristo y su Palabra con tal de que sean quebrantadas tus propias ideas y las imposiciones que trata de forjar este mundo en tu corazón y la tendencia pecaminosa que ya por defecto nuestro corazón pecaminoso trae?",
        minLabel: "1 - Muy poco comprometido",
        maxLabel: "10 - Absolutamente comprometido a ser transformado"
      },
      {
        id: "p_v2_5",
        seccionId: "sec_v2",
        versiculo: "Romanos 12:2",
        pregunta:
          "¿Qué tan importante es en tu día a día descubrir la voluntad de Dios para tu vida a través de los medios que Él te ha dejado?",
        minLabel: "1 - Casi no es prioridad",
        maxLabel: "10 - Es mi más alta prioridad diaria"
      },
      {
        id: "p_v2_6",
        seccionId: "sec_v2",
        versiculo: "Romanos 12:2",
        pregunta:
          "¿Qué tan consciente eres de que la voluntad de Dios siempre será más buena, más agradable y más perfecta que la voluntad de tu propio corazón y la voluntad que te ofrece este mundo?",
        minLabel: "1 - Dudo con frecuencia",
        maxLabel: "10 - Plena convicción de su perfección"
      }
    ]
  },
  {
    id: "sec_v3_5",
    titulo: "3. Humildad y Conciencia de Cuerpo",
    versiculoRef: "Romanos 12:3-5",
    textoBiblico:
      "Digo, pues, por la gracia que me es dada, a cada cual que está entre vosotros, que no tenga más alto concepto de sí que el que debe tener, sino que piense de sí con cordura, conforme a la medida de fe que Dios repartió a cada uno. Porque de la manera que en un cuerpo tenemos muchos miembros, pero no todos los miembros tienen la misma función, así nosotros, siendo muchos, somos un cuerpo en Cristo, y todos miembros los unos de los otros.",
    preguntas: [
      {
        id: "p_v3_a",
        seccionId: "sec_v3_5",
        versiculo: "Romanos 12:3-5",
        pregunta:
          "a. ¿Qué tanto puedes reconocer que eres parte de un pueblo donde todos somos iguales y donde todos apuntamos al único digno y merecedor de toda nuestra atención y no que todo gira en torno a nosotros?",
        minLabel: "1 - Me cuesta no ser el centro",
        maxLabel: "10 - Totalmente convencido de la gloria de Cristo"
      },
      {
        id: "p_v3_b",
        seccionId: "sec_v3_5",
        versiculo: "Romanos 12:3-5",
        pregunta:
          "b. ¿Qué tan consciente eres de que necesitas a tus hermanos en la fe para sostenerte en tu día a día y que no eres capaz de sustentarte solo por tu propia fuerza y capacidad?",
        minLabel: "1 - Muy individualista / Autosuficiente",
        maxLabel: "10 - Plena conciencia de interdependencia fraternal"
      },
      {
        id: "p_v3_c",
        seccionId: "sec_v3_5",
        versiculo: "Romanos 12:3-5",
        pregunta:
          "c. ¿Qué tan consciente estás del papel que Dios ha delegado para ti dentro Su Reino y de lo importante que es para sostener la vida de otros?",
        minLabel: "1 - Desconozco o ignoro mi papel",
        maxLabel: "10 - Muy consciente de mi función en el cuerpo"
      },
      {
        id: "p_v3_d",
        seccionId: "sec_v3_5",
        versiculo: "Romanos 12:3-5",
        pregunta:
          "d. ¿Qué tan importante y prioritario es para ti ser parte de cada actividad, evento o servicio que el cuerpo de Cristo realiza en su iglesia, donde cada miembro ejerce el don de fe que Dios le ha regalado para sostenernos los unos a los otros?",
        minLabel: "1 - Muy poca importancia / Asistencia esporádica",
        maxLabel: "10 - Prioridad indispensable en mi vida"
      }
    ]
  },
  {
    id: "sec_dones",
    titulo: "4. Evaluación y Descubrimiento de Dones Espirituales",
    versiculoRef: "Romanos 12:6-8",
    textoBiblico:
      "De manera que, teniendo diferentes dones, según la gracia que nos es dada, si el de profecía, úsese conforme a la medida de la fe; o si de servicio, en servir; o el que enseña, en la enseñanza; el que exhorta, en la exhortación; el que reparte, con liberalidad; el que preside, con solicitud; el que hace misericordia, con alegría.",
    esDones: true
  },
  {
    id: "sec_v9",
    titulo: "5. Amor Genuino y Aborrecer lo Malo",
    versiculoRef: "Romanos 12:9",
    textoBiblico: "El amor sea sin fingimiento. Aborreced lo malo, seguid lo bueno.",
    preguntas: [
      {
        id: "p_v9_a",
        seccionId: "sec_v9",
        versiculo: "Romanos 12:9",
        pregunta: "a. ¿Qué tanto de lo que haces es el resultado de un amor genuino que no espera nada a cambio?",
        minLabel: "1 - Con frecuencia espero recompensas",
        maxLabel: "10 - Amor genuino y desinteresado"
      },
      {
        id: "p_v9_b",
        seccionId: "sec_v9",
        versiculo: "Romanos 12:9",
        pregunta:
          "b. ¿Las cosas que consumes a diario en los medios digitales, la actitud con que enfrentas las situaciones de la vida y tu búsqueda constante, apuntan a un genuino rechazo por los valores que promueve este mundo?",
        minLabel: "1 - Tolero o me atrae lo malo del mundo",
        maxLabel: "10 - Rechazo genuino por lo pecaminoso"
      },
      {
        id: "p_v9_c",
        seccionId: "sec_v9",
        versiculo: "Romanos 12:9",
        pregunta:
          "c. ¿Haces un esfuerzo consciente y constante para consumir en tu día a día un contenido que evidencie tu compromiso de seguir los principios del evangelio y no las vanidades que nos ofrece este mundo?",
        minLabel: "1 - Muy poco esfuerzo",
        maxLabel: "10 - Esfuerzo disciplinado y constante"
      }
    ]
  },
  {
    id: "sec_v10",
    titulo: "6. Amor Fraternal y Preferencia en la Honra",
    versiculoRef: "Romanos 12:10",
    textoBiblico: "Amaos los unos a los otros con amor fraternal; en cuanto a honra, prefiriéndoos los unos a los otros.",
    preguntas: [
      {
        id: "p_v10_a",
        seccionId: "sec_v10",
        versiculo: "Romanos 12:10",
        pregunta:
          "a. ¿Qué tanto evidencia mi amor por mis hermanos un interés profundo por conocerlos mejor con tal de servirle mejor?",
        minLabel: "1 - Muy superficial / No me intereso",
        maxLabel: "10 - Interés profundo y constante por servirles"
      },
      {
        id: "p_v10_b",
        seccionId: "sec_v10",
        versiculo: "Romanos 12:10",
        pregunta:
          "b. ¿Qué tanto evidencia mi amor por mis hermanos un interés profundo en hablarles en cada oportunidad a fin de tener conversaciones saludables que glorifiquen a Dios y edifiquen sus vidas?",
        minLabel: "1 - Conversaciones vacías o críticas",
        maxLabel: "10 - Conversaciones de edificación y gracia"
      },
      {
        id: "p_v10_c",
        seccionId: "sec_v10",
        versiculo: "Romanos 12:10",
        pregunta:
          "c. ¿Qué tanto evidencia mi amor por mis hermanos un interés profundo en hacer cosas concretas con tal de ayudarle?",
        minLabel: "1 - Me quedo en palabras",
        maxLabel: "10 - Acciones prácticas constantes de ayuda"
      },
      {
        id: "p_v10_d",
        seccionId: "sec_v10",
        versiculo: "Romanos 12:10",
        pregunta:
          "d. ¿Qué tan importante es para mí reconocer la labor de los demás antes que buscar el elogio de los demás hacia mi mismo?",
        minLabel: "1 - Busco mi propio elogio y protagonismo",
        maxLabel: "10 - Prefiero honrar y exaltar a mis hermanos"
      }
    ]
  },
  {
    id: "sec_v11",
    titulo: "7. Diligencia, Fervor Espiritual y Servicio al Señor",
    versiculoRef: "Romanos 12:11",
    textoBiblico: "En lo que requiere diligencia, no perezosos; fervientes en espíritu, sirviendo al Señor;",
    esDiligenciaTexto: true,
    preguntas: [
      {
        id: "p_v11_a",
        seccionId: "sec_v11",
        versiculo: "Romanos 12:11",
        pregunta: "a. ¿Qué tan diligente consideras que has sido con las cosas que escribiste en esta lista?",
        minLabel: "1 - Muy perezoso o descuidado",
        maxLabel: "10 - Altamente diligente y comprometido"
      },
      {
        id: "p_v11_b",
        seccionId: "sec_v11",
        versiculo: "Romanos 12:11",
        pregunta:
          "b. ¿Qué tanta pasión o qué tan emocionado te sientes al pensar, hablar o hacer las cosas que están en la lista?",
        minLabel: "1 - Indiferente / Rutinario",
        maxLabel: "10 - Ferviente en espíritu y lleno de pasión"
      },
      {
        id: "p_v11_c",
        seccionId: "sec_v11",
        versiculo: "Romanos 12:11",
        pregunta: "¿Qué tanto tiempo le dedicas a servir al Señor a través de las cosas que puso Jesús en tu lista?",
        minLabel: "1 - Casi ningún tiempo",
        maxLabel: "10 - Tiempo intencional, abundante y constante"
      }
    ]
  },
  {
    id: "sec_v12_13",
    titulo: "8. Esperanza, Tribulación, Oración y Hospitalidad",
    versiculoRef: "Romanos 12:12-13",
    textoBiblico:
      "Gozosos en la esperanza; sufridos en la tribulación; constantes en la oración; compartiendo para las necesidades de los santos; practicando la hospitalidad.",
    preguntas: [
      {
        id: "p_v12_a",
        seccionId: "sec_v12_13",
        versiculo: "Romanos 12:12",
        pregunta:
          "a. No importa las dificultades que enfrente, suelo aferrarme constantemente al hecho de que un día estaré con mi Dios cara a cara.",
        minLabel: "1 - Pierdo la esperanza fácilmente",
        maxLabel: "10 - Plena certeza gozosa en la eternidad"
      },
      {
        id: "p_v12_b",
        seccionId: "sec_v12_13",
        versiculo: "Romanos 12:12",
        pregunta:
          "b. Soy cada vez más consciente que ser creyente produce aflicciones, oprobio, rechazo y dificultad pero me gozo en saber que es un privilegio sufrir por Su causa.",
        minLabel: "1 - Me quejo o me resiento",
        maxLabel: "10 - Lo considero un gozo y privilegio santo"
      },
      {
        id: "p_v12_c",
        seccionId: "sec_v12_13",
        versiculo: "Romanos 12:12",
        pregunta:
          "c. Entiendo mi pobreza espiritual y constantemente necesito ir a la presencia de Dios en oración porque necesito con desesperación contemplar su hermosura, descansar en su gracia y hallar las fuerzas que necesito en el poder de El.",
        minLabel: "1 - Poca o nula oración diaria",
        maxLabel: "10 - Constancia y necesidad ferviente en oración"
      },
      {
        id: "p_v12_d",
        seccionId: "sec_v12_13",
        versiculo: "Romanos 12:13",
        pregunta:
          "d. Estoy comprometido con dar mis diezmos y mis ofrendas a fin de que la iglesia tenga la capacidad de compartir con otros supliendo sus necesidades.",
        minLabel: "1 - Inconstante o descuidado",
        maxLabel: "10 - Fielmente comprometido y generoso"
      },
      {
        id: "p_v12_e",
        seccionId: "sec_v12_13",
        versiculo: "Romanos 12:13",
        pregunta:
          "e. Soy proactivo a la hora de poner todos mis recursos, incluyendo casa, vehículos o cualquier bien material, a la disposición de mis hermanos y de quienes lo necesiten sin esperar nada a cambio.",
        minLabel: "1 - Muy apegado a lo material",
        maxLabel: "10 - Hospitalario y generoso de corazón"
      }
    ]
  },
  {
    id: "sec_v14_15",
    titulo: "9. Bendecir al Perseguidor y Empatía Fraternal",
    versiculoRef: "Romanos 12:14-15",
    textoBiblico:
      "Bendecid a los que os persiguen; bendecid, y no maldigáis. Gozaos con los que se gozan; llorad con los que lloran.",
    preguntas: [
      {
        id: "p_v14_a",
        seccionId: "sec_v14_15",
        versiculo: "Romanos 12:14",
        pregunta:
          "a. Antes que maldecir o menospreciar, tengo un profundo interés por predicar el evangelio y bendecir las vidas de quienes me tratan mal o me menosprecian por ser cristiano.",
        minLabel: "1 - Guardo rencor o deseos de desquite",
        maxLabel: "10 - Bendigo sinceramente e intercedo por ellos"
      },
      {
        id: "p_v14_b",
        seccionId: "sec_v14_15",
        versiculo: "Romanos 12:15",
        pregunta:
          "b. Procuro ser parte de la vida en comunidad con mis hermanos disfrutando de cada momento y ocasión que como iglesia podamos disfrutar y contribuyo para que estos momentos de gozo y alegría sucedan.",
        minLabel: "1 - Aislado / Envidia del bien ajeno",
        maxLabel: "10 - Me gozo genuinamente con los que se gozan"
      },
      {
        id: "p_v14_c",
        seccionId: "sec_v14_15",
        versiculo: "Romanos 12:15",
        pregunta:
          "c. Tengo un fiel compromiso con visitar a las viudas, ancianos, enfermos o hermanos que están pasando un momento de dificultad. Siempre estoy dispuesto a escucharlos, a identificarme con su necesidad y a llorar con ellos en sus momentos de dolor o duelo.",
        minLabel: "1 - Raras veces visito o escucho",
        maxLabel: "10 - Empatía activa y visitas constantes"
      }
    ]
  },
  {
    id: "sec_v16",
    titulo: "10. Unanimidad, Humildad y Asociarse con los Humildes",
    versiculoRef: "Romanos 12:16",
    textoBiblico:
      "Unánimes entre vosotros; no altivos, sino asociándoos con los humildes. No seáis sabios en vuestra propia opinión.",
    preguntas: [
      {
        id: "p_v16_a",
        seccionId: "sec_v16",
        versiculo: "Romanos 12:16",
        pregunta:
          "a. Dedico tiempo intencional a relacionarme con aquellos que son nuevos en la iglesia o con quienes podrían necesitar de mi apoyo para instruir o apoyarlo en su vida como cristiano.",
        minLabel: "1 - Me cierro en mi propio círculo",
        maxLabel: "10 - Acogedor e intencional con los nuevos y humildes"
      },
      {
        id: "p_v16_b",
        seccionId: "sec_v16",
        versiculo: "Romanos 12:16",
        pregunta:
          "b. Soy consciente de mi necesidad de acercarme a otros a buscar su ayuda, su apoyo y orientación para que ellos me ayuden en mi vida cristiana ya que no soy suficiente y no lo sé todo.",
        minLabel: "1 - Orgulloso / Sabio en mi opinión",
        maxLabel: "10 - Manso, enseñable y dispuesto a recibir ayuda"
      }
    ]
  },
  {
    id: "sec_v17_21",
    titulo: "11. Vencer el Mal con el Bien y Manejo de Conflictos",
    versiculoRef: "Romanos 12:17-21",
    textoBiblico:
      "No paguéis a nadie mal por mal; procurad lo bueno delante de todos los hombres. Si es posible, en cuanto dependa de vosotros, estad en paz con todos los hombres. No os venguéis vosotros mismos, amados míos, sino dejad lugar a la ira de Dios; porque escrito está: Mía es la venganza, yo pagaré, dice el Señor. Así que, si tu enemigo tuviere hambre, dale de comer; si tuviere sed, dale de beber; pues haciendo esto, ascuas de fuego amontonarás sobre su cabeza. No seas vencido de lo malo, sino vence con el bien el mal.",
    preguntas: [
      {
        id: "p_v17_a",
        seccionId: "sec_v17_21",
        versiculo: "Romanos 12:17-21",
        pregunta:
          "a. Sin importar qué tan mal hagan las cosas los demás, sé que le sirvo a Dios y mi objetivo siempre es agradarle a Él y hacer el bien no porque los demás lo merezcan, sino porque así como Cristo me ha amado a pesar de yo no merecerlo, así debo de amar a otros aun sin ellos merecerlo.",
        minLabel: "1 - Devuelvo mal por mal",
        maxLabel: "10 - Reflejo la gracia inmerecida de Cristo"
      },
      {
        id: "p_v17_b",
        seccionId: "sec_v17_21",
        versiculo: "Romanos 12:18-19",
        pregunta:
          "b. Siempre busco con humildad considerar a Dios en cada conflicto con mi prójimo con tal de hablar y actuar bajo la agenda de Dios y no la mía, de modo que mis palabras y acciones están sazonadas con el amor de Dios y no por mi justicia.",
        minLabel: "1 - Busco mi propia venganza y razón",
        maxLabel: "10 - Dejo lugar a Dios y persigo la paz"
      },
      {
        id: "p_v17_c",
        seccionId: "sec_v17_20-21",
        versiculo: "Romanos 12:20-21",
        pregunta:
          "c. Procuro que el manejo de los conflictos sea una forma de dejar un testimonio de fe que pueda impactar las vidas de todos los involucrados.",
        minLabel: "1 - Vencido por la amargura y el mal",
        maxLabel: "10 - Vencedor del mal con el bien"
      }
    ]
  }
];

export interface ResultadoEvaluacion {
  promedioGeneral: number; // 1 a 10
  porcentajeGeneral: number; // 0% a 100%
  categoriaEspiritual: {
    titulo: string;
    descripcion: string;
    color: string;
    insignia: string;
  };
  desgloseSecciones: Array<{
    id: string;
    titulo: string;
    versiculoRef: string;
    promedio: number;
    porcentaje: number;
    cantidadPreguntas: number;
  }>;
  donPrincipal: DonEspiritual;
  donSecundario?: DonEspiritual;
  rankingDones: Array<{
    don: DonEspiritual;
    puntaje: number;
  }>;
  prioridades: Array<{
    area: string;
    versiculo: string;
    pregunta: string;
    puntaje: number;
    motivoBiblico: string;
    planAccion: string;
  }>;
  diligenciasJesus: string[];
}

export function calcularResultadoBiblosTest(
  respuestasEscala: Record<string, number>,
  rankingDones: Record<number, number>,
  donSeleccionadoId: number | null,
  diligenciasJesus: string[]
): ResultadoEvaluacion {
  // 1. Calcular promedio general y desglose por sección
  let sumaTotal = 0;
  let totalPreguntas = 0;

  const desgloseSecciones = SECCIONES_EVALUACION.map((sec) => {
    if (!sec.preguntas || sec.preguntas.length === 0) {
      return null;
    }
    let sumaSeccion = 0;
    let cantSeccion = 0;

    sec.preguntas.forEach((p) => {
      const val = respuestasEscala[p.id] || 0;
      if (val > 0) {
        sumaSeccion += val;
        cantSeccion++;
        sumaTotal += val;
        totalPreguntas++;
      }
    });

    const promedioSeccion = cantSeccion > 0 ? Number((sumaSeccion / cantSeccion).toFixed(1)) : 0;
    return {
      id: sec.id,
      titulo: sec.titulo,
      versiculoRef: sec.versiculoRef,
      promedio: promedioSeccion,
      porcentaje: Math.round(promedioSeccion * 10),
      cantidadPreguntas: cantSeccion
    };
  }).filter(Boolean) as Array<{
    id: string;
    titulo: string;
    versiculoRef: string;
    promedio: number;
    porcentaje: number;
    cantidadPreguntas: number;
  }>;

  const promedioGeneral = totalPreguntas > 0 ? Number((sumaTotal / totalPreguntas).toFixed(1)) : 0;
  const porcentajeGeneral = Math.round(promedioGeneral * 10);

  // 2. Determinar categoría espiritual
  let categoriaEspiritual = {
    titulo: "Madurez Espiritual Sólida",
    descripcion: "Evidencias una vida consagrada, arraigada en la Palabra y con un alto sentido de culto y servicio sacrificial a Dios.",
    color: "#16a34a",
    insignia: "🥇"
  };

  if (promedioGeneral >= 8.5) {
    categoriaEspiritual = {
      titulo: "Consagración Sobresaliente",
      descripcion: "Tu caminar cristiano refleja una entrega profunda al Señorío de Cristo, renovación mental y celo por edificar Su cuerpo.",
      color: "#059669",
      insignia: "💎"
    };
  } else if (promedioGeneral >= 7.0) {
    categoriaEspiritual = {
      titulo: "Crecimiento Espiritual Firme",
      descripcion: "Tienes un fundamento cristiano positivo y compromiso vivo, con áreas identificadas listas para madurar al siguiente nivel.",
      color: "#0284c7",
      insignia: "🌿"
    };
  } else if (promedioGeneral >= 5.0) {
    categoriaEspiritual = {
      titulo: "Etapa de Discipulado y Desarrollo",
      descripcion: "Muestras intenciones sinceras, pero enfrentas luchas con las demandas del mundo y requieres mayor constancia en la vida de iglesia.",
      color: "#d97706",
      insignia: "🌱"
    };
  } else {
    categoriaEspiritual = {
      titulo: "Llamado a Renovación y Consagración",
      descripcion: "Romanos 12 te hace un llamado amoroso y urgente a rendir todas tus áreas al Señor y volver a las disciplinas espirituales básicas.",
      color: "#dc2626",
      insignia: "🔥"
    };
  }

  // 3. Procesar ranking de dones
  const listaRanking = Object.entries(DONES_ROMANOS_12).map(([numStr, don]) => {
    const num = Number(numStr);
    const puntaje = rankingDones[num] || 0;
    return { don, puntaje };
  });

  listaRanking.sort((a, b) => b.puntaje - a.puntaje);

  // Si el usuario seleccionó un don explícito en el paso final, lo tomamos como principal
  let donPrincipal = donSeleccionadoId && DONES_ROMANOS_12[donSeleccionadoId]
    ? DONES_ROMANOS_12[donSeleccionadoId]
    : listaRanking[0].don;

  let donSecundario = listaRanking.find((item) => item.don.numero !== donPrincipal.numero)?.don;

  // 4. Identificar prioridades de crecimiento (respuestas más bajas)
  const todasLasPreguntas: Array<{
    pregunta: PreguntaEscala;
    seccionTitulo: string;
    puntaje: number;
  }> = [];

  SECCIONES_EVALUACION.forEach((sec) => {
    if (sec.preguntas) {
      sec.preguntas.forEach((p) => {
        const val = respuestasEscala[p.id] || 0;
        todasLasPreguntas.push({
          pregunta: p,
          seccionTitulo: sec.titulo,
          puntaje: val
        });
      });
    }
  });

  // Ordenar de menor a mayor puntaje
  todasLasPreguntas.sort((a, b) => a.puntaje - b.puntaje);

  // Tomar las 3 preguntas con menor puntaje para priorizar
  const prioridades = todasLasPreguntas.slice(0, 3).map((item) => {
    const { pregunta, puntaje } = item;
    let motivoBiblico = "Romanos 12 nos enseña que toda nuestra vida debe reflejar la gloria y señorío de Cristo.";
    let planAccion = "Establece un hábito diario de oración y lectura bíblica intencional.";

    if (pregunta.versiculo.includes("12:1")) {
      motivoBiblico = "Tu cuerpo y tus fuerzas le pertenecen a Dios. Él no pide una parte, sino todo tu ser como sacrificio vivo y agradable.";
      planAccion = "Evalúa en oración qué comodidades, tiempo o hábitos estás reteniendo para ti y preséntalos al altar del Señor cada mañana.";
    } else if (pregunta.versiculo.includes("12:2")) {
      motivoBiblico = "El mundo busca forjar tus valores mediante las redes y algoritmos; solo la Palabra renovará tu mente para conocer la perfecta voluntad de Dios.";
      planAccion = "Reduce el tiempo en pantallas y redes sociales antes de dormir y al despertar, sustituyéndolo con meditación en las Escrituras.";
    } else if (pregunta.versiculo.includes("12:3-5")) {
      motivoBiblico = "Nadie es autosuficiente en el Reino. Fuimos creados para estar interconectados como miembros del mismo cuerpo.";
      planAccion = "Involúcrate con regularidad en los servicios, células y actividades de la iglesia local, buscando activamente a tus hermanos.";
    } else if (pregunta.versiculo.includes("12:9")) {
      motivoBiblico = "El amor cristiano no finge ni tolera lo malo; abraza con celo la verdad y la santidad del Evangelio.";
      planAccion = "Revisa con sinceridad tus motivos al servir y aléjate de contenidos que normalicen lo que Dios aborrece.";
    } else if (pregunta.versiculo.includes("12:10")) {
      motivoBiblico = "La honra mutua desarraiga la competencia y el egoísmo entre los hermanos de la congregación.";
      planAccion = "Toma la iniciativa de felicitar, animar y servir a otros hermanos sin esperar reconocimiento para ti.";
    } else if (pregunta.versiculo.includes("12:11")) {
      motivoBiblico = "La pereza apaga el fuego del Espíritu. Dios busca creyentes fervientes y diligentes en Su obra.";
      planAccion = "Elige una de las cosas anotadas en tu lista de Jesús y ponle un día, hora y plan concreto de servicio esta semana.";
    } else if (pregunta.versiculo.includes("12:12-13")) {
      motivoBiblico = "La constancia en la oración y la generosidad práctica sostienen al creyente en tiempos de prueba y bendicen al prójimo.";
      planAccion = "Aparta 15 minutos diarios exclusivos para orar con desesperación por la presencia de Dios y practica la generosidad sin reservas.";
    } else if (pregunta.versiculo.includes("12:14-15")) {
      motivoBiblico = "El evangelio se demuestra bendiciendo al que nos lastima y teniendo empatía real con las lágrimas y alegrías del prójimo.";
      planAccion = "Ora por alguien que te haya tratado mal y programa una visita o llamada a un hermano que esté pasando necesidad o duelo.";
    } else if (pregunta.versiculo.includes("12:16")) {
      motivoBiblico = "El orgullo y la autosuficiencia aíslan al creyente; la humildad nos une a los nuevos y sencillos.";
      planAccion = "Acércate a un miembro nuevo de la iglesia este domingo para conocerlo, y ten la humildad de pedir consejo pastoral.";
    } else if (pregunta.versiculo.includes("12:17-21")) {
      motivoBiblico = "Vencer el mal con el bien desarma al enemigo y glorifica a Dios, dejando la justicia en Sus manos perfectas.";
      planAccion = "Renuncia a la revancha o la queja; responde con una acción buena, generosa o pacífica hacia quien te haya ofendido.";
    }

    return {
      area: item.seccionTitulo,
      versiculo: pregunta.versiculo,
      pregunta: pregunta.pregunta,
      puntaje: puntaje,
      motivoBiblico,
      planAccion
    };
  });

  return {
    promedioGeneral,
    porcentajeGeneral,
    categoriaEspiritual,
    desgloseSecciones,
    donPrincipal,
    donSecundario,
    rankingDones: listaRanking,
    prioridades,
    diligenciasJesus: diligenciasJesus.filter((d) => d && d.trim().length > 0)
  };
}
