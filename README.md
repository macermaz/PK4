# PSYKAT - Mobile Therapist Simulator

## Descripción

PSYKAT es una aplicación móvil gamificada que simula el sistema operativo de un terapeuta, permitiendo a estudiantes y profesionales de psicología practicar entrevistas clínicas y diagnósticos en un entorno interactivo y seguro.

## Características Principales

### 🏠 Sistema PsykatOS
- **Pantalla de bloqueo** personalizable con doble tap para desbloquear
- **Escritorio móvil** con iconos de aplicaciones funcionales
- **Temas desbloqueables** según nivel de usuario
- **Notificaciones push** simuladas para nuevos casos

### 💬 Mensajería (Funcionalidad Principal)
- **Chat tipo WhatsApp** con interfaz familiar
- **5 preguntas por sesión** con contador visual
- **Sistema de rapport** que afecta la profundidad de las respuestas
- **Múltiples casos simultáneos** (máximo 5 activos)
- **Menú inter-sesiones** con opciones:
  - Nueva sesión
  - Herramienta diagnóstico
  - Guardar y salir
  - Anular caso

### 📧 Correo
- **Email diario** del secretario con nuevos casos
- **Sistema de notificaciones** con badges
- **Procesamiento automático** de nuevos pacientes

### 👥 Contactos
- **Lista de pacientes** disponibles
- **Indicadores visuales** para casos nuevos
- **Información básica** de cada paciente

### 🔍 Herramienta de Diagnóstico
- **Filtro de síntomas** DSM-5-TR organizados por categorías
- **Sistema de hipótesis** con porcentaje de coincidencia
- **Baterías de tests** aplicables (BDI-II, BAI, PCL-5, AUDIT)
- **Selector DSM-5-TR** para diagnóstico final

### 📺 TubeTok
- **Feed de videos educativos** sobre psicología
- **Sistema de interacción** (like, share, save)
- **Monetización** mediante anuncios (solo en free version)

### 📔 Diario Clínico
- **Wiki DSM-5-TR** con información básica
- **Información de baterías** de tests
- **Buenas prácticas** clínicas
- **Sección de guardados** para contenido favorito

### 🏆 Sistema de Progreso
- **Experiencia (XP)** por casos completados
- **Niveles** con desbloqueo de contenido
- **Retroalimentación** post-diagnóstico
- **Estadísticas** de rendimiento

## Mecánicas de Juego

### Sistema de Preguntas
- **Límite de 5 preguntas por sesión**
- **Respuestas contextuales** basadas en palabras clave
- **Profundidad variable** según tipo de pregunta
- **Inventario de detalles** coherente con la historia

### Diagnóstico
- **No forzado** - el usuario decide cuándo diagnosticar
- **Sistema de puntaje** basado en precisión y profundidad
- **Retroalimentación inmediata** con consejos de mejora

### Progresión
- **Casos ilimitados** para usuarios premium
- **2 casos difíciles diarios** para usuarios free
- **Desbloqueo progresivo** de modos y contenido

## Tecnología

### Frontend
- **HTML5/CSS3/JavaScript** vanilla
- **Anime.js** para animaciones
- **Typed.js** para efectos de texto
- **Font Awesome** para iconos
- **Diseño responsive** para móviles

### Almacenamiento
- **LocalStorage** para estado de la aplicación
- **Datos persistentes** de casos y progreso

### Características Técnicas
- **Sin dependencias externas** (funciona offline)
- **Animaciones fluidas** con hardware acceleration
- **Gestos táctiles** optimizados
- **Rendimiento optimizado** para dispositivos móviles

## Estructura del Proyecto

```
/mnt/okcomputer/output/
├── index.html          # Página principal
├── styles.css          # Estilos y temas
├── main.js            # Lógica de la aplicación
├── README.md          # Este archivo
└── resources/         # Recursos multimedia (si se añaden)
```

## Uso

### Instalación
1. Clonar o descargar los archivos
2. Abrir `index.html` en un navegador web
3. Para mejor experiencia, usar en modo móvil (F12 → Responsive Mode)

### Primeros Pasos
1. **Desbloquear** el dispositivo con doble tap
2. **Revisar el correo** para nuevos casos
3. **Añadir contactos** desde la lista disponible
4. **Iniciar conversación** en Mensajería
5. **Aplicar baterías** de tests cuando sea apropiado
6. **Formular diagnóstico** usando la herramienta
7. **Recibir retroalimentación** y XP

### Controles
- **Tap**: Seleccionar/interactuar
- **Doble tap**: Desbloquear pantalla
- **Swipe**: Navegar entre chats (en futuras versiones)
- **Back button**: Navegar hacia atrás

## Datos Clínicos

### Trastornos Incluidos
- **Depresión Mayor** (F32.x)
- **Trastorno de Ansiedad Generalizada** (F41.1)
- **Trastorno de Pánico** (F41.0)
- **Y más** según avance el usuario

### Baterías de Tests
- **BDI-II**: Inventario de Depresión de Beck
- **BAI**: Inventario de Ansiedad de Beck
- **PCL-5**: Checklist TEPT
- **AUDIT**: Cuestionario de Identificación de Trastornos por Consumo de Alcohol

## Monetización

### Modelo Freemium
- **Versión Free**: Casos normales ilimitados, 2 casos difíciles/día, anuncios en TubeTok
- **Versión Premium**: Todos los modos ilimitados, sin anuncios, contenido exclusivo

### Puntos de Monetización
- **Anuncios** en TubeTok (banners y rewarded)
- **Suscripción premium** mensual/anual
- **Pase de temporada** con contenido cosmético
- **Skins y temas** desbloqueables

## Futuras Mejoras

### Funcionalidades Planificadas
- [ ] **Sistema de notas** durante las sesiones
- [ ] **Estadísticas detalladas** de rendimiento
- [ ] **Modo multijugador** (comparación de diagnósticos)
- [ ] **Casos históricos** con personajes reales
- [ ] **Integración con API** de IA para respuestas más sofisticadas
- [ ] **Exportación de casos** para análisis académico

### Mejoras Técnicas
- [ ] **PWA** (Progressive Web App)
- [ ] **Offline mode** completo
- [ ] **Sincronización** en la nube
- [ ] **Multiidioma** (inglés, portugués)

## Contribuciones

Este proyecto está diseñado como una herramienta educativa. Las contribuciones son bienvenidas para:
- Mejorar la precisión clínica
- Añadir nuevos casos y trastornos
- Optimizar la experiencia de usuario
- Implementar nuevas funcionalidades

## Licencia

Proyecto educativo - No comercial
© 2024 PSYKAT - Mobile Therapist Simulator

## Agradecimientos

- **DSM-5-TR** por los criterios diagnósticos
- **Comunidad psicológica** por el feedback
- **Open source libraries** utilizadas
- **Colaboradores** y beta testers

---

**Nota**: Esta aplicación es una herramienta de entrenamiento y no debe usarse como sustituto de la evaluación clínica profesional. Todos los casos son ficticios y diseñados exclusivamente para fines educativos.