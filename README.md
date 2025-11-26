# PSYKAT 4.0 - Mobile Therapist Simulator

## 1. Concepto

| Aspecto | Descripción |
|---------|-------------|
| Nombre | PSYKAT - Mobile Therapist Simulator |
| Concepto | Simulador del móvil de un terapeuta (PsykatOS) |
| Mascota | PSYKAT - Gato psicólogo que nos deriva casos |
| Público | Estudiantes de psicología, residentes, profesionales |
| Modelo | Freemium (gratis con límites + premium) |

## 2. Personajes

| Personaje | Apariencia | Rol |
|-----------|------------|-----|
| PSYKAT | Gato normal | Profesional que deriva casos ("secretario") |
| Dr. Domingo | PSYKAT + bigote + bata | Supervisor, da feedback |
| PSYKAT paciente | PSYKAT disfrazado | Modo Sandbox/práctica |

## 3. Apps del Escritorio

| Icono | App | Función | Estado |
|-------|-----|---------|--------|
| 💬 | Mensajería | Chats activos con pacientes | ✅ Implementado |
| 📧 | Correo | Casos nuevos, catálogo PSYKEA, notificaciones | ✅ Implementado |
| 👥 | Contactos | Pacientes añadidos (info, notas, tests) | ✅ Implementado |
| 🩺 | **Diagnóstico** | **Herramienta diagnóstica separada** | ✅ **v4.0 NUEVO** |
| 📹 | TubeTok | Videos educativos (aquí van ads) | ✅ Básico |
| 📔 | Diario | DSM-5, tests, tratamientos, biblioteca casos | ✅ Implementado |
| 🎥 | Consulta | Cámara de la consulta de PSYKAT | ❌ Pendiente |
| 🏆 | Logros | Rankings, achievements, estadísticas | ❌ Pendiente |
| ⚙️ | Ajustes | Configuración, accesibilidad, cuenta | ✅ Implementado |

## 4. Sistema de Correos

### Correos de PSYKAT (modos básicos):
- **Entrenamiento**: Casos de práctica con ayudas
- **Normal**: Pacientes directos o derivados
- **Difícil**: Casos más complejos, familiar contacta
- **Realista**: Pacientes reservados, rapport activo

**NUEVO en v4.0**: El secretario PSYKAT ahora tiene personalidad con comentarios contextuales:
- Comentarios específicos por trastorno (ej: "He verificado las salidas de emergencia" para pánico)
- Comentarios por dificultad del caso
- Comentarios sobre si contactó familiar o paciente
- Memes internos de psicología y humor respetuoso

### Correos de Agencias (modo histórico):
- C.A.T. (Comisión de Atención Temporal)
- C.A.U.P. (Comisión de Ayuda Universal Paralela)
- A.R.C.A. (Agencia de Rescate de Casos Atípicos)
- Portal Psi, Archivo Omega, Nexus
- 1/5 correos = nombre inventado por IA según temática

### Otros correos:
- **PSYKEA**: Catálogo de muebles para la consulta
- **Dr. Domingo**: Feedback post-caso
- **Sistema**: Eventos, urgencias, notificaciones

## 5. Límites de Casos Simultáneos

| Modo | Máximo | Sin correos nuevos si lleno |
|------|--------|----------------------------|
| Entrenamiento | 1 | ✓ |
| Normal | 2 | ✓ |
| Difícil | 2 | ✓ |
| Realista | 1 | ✓ |
| **TOTAL** | 6 | - |

## 6. Flujo de un Caso (ACTUALIZADO v4.0)

1. Correo de PSYKAT/Agencia → genera seed del paciente
2. "Añadir a contactos" → paciente en lista
3. Tap contacto → abre chat → mensajes auto de saludo **contextuales**
4. 5 preguntas por sesión
5. **Fin sesión → mensaje de despedida automático con IA**
6. **Ir a "Herramienta Diagnóstica" (app separada)**
7. **Herramienta Diagnóstica:**
   - Tab Hipótesis: Seleccionar síntomas + áreas de vida
   - Tab Tests: Aplicar tests psicológicos (con coste)
   - Tab Diagnóstico: Elegir diagnóstico DSM-5
   - Tab Tratamiento: Seleccionar tratamiento
8. Enviar tratamiento → **esperar resultado (timer en Herramienta Diagnóstica)**
9. **Verificar resultado cuando timer termine**
10. Si correcto → ResultsScreen → logro
11. Si incorrecto (1er intento) → segunda oportunidad
12. Si incorrecto (2do intento) → caso perdido

## 7. Interfaz del Chat (ACTUALIZADO v4.0)

```
┌─────────────────────────────────┐
│ ←  |   Ana Martínez    | 🔴 ⓘ  │
├─────────────────────────────────┤
│                                 │
│     [Burbujas de chat]          │
│                                 │
├─────────────────────────────────┤
│  ⊕  (__________________)   →   │
└─────────────────────────────────┘
```

### Panel lateral deslizable (ⓘ):
- **Expediente del paciente**
- Información básica
- Backstory
- Síntomas detectados
- Áreas de vida exploradas
- Notas clínicas
- Rapport (solo Realista)
- Historial de tests

### Botón "⊕" (herramientas):
- 📝 **Notas Clínicas** - Añadir observaciones
- 📂 **Ver Expediente** - Abrir panel lateral

### Botón "🔴" (derivar caso):
- Envía mensaje de derivación contextual
- Diferente según primera sesión vs seguimiento
- Muestra confirmación antes de cancelar

## 8. Herramienta Diagnóstica (NUEVA v4.0)

**App independiente del chat** con selector de casos y 4 pestañas:

### Tab 1: Hipótesis
- Selección de áreas de vida (trabajo, familia, pareja, etc.)
- Lista de síntomas por categoría
- Generación automática de hipótesis con % de coincidencia
- Ordenado por probabilidad

### Tab 2: Tests
- Todos los tests disponibles (con coste en monedas)
- Aplicar test → resultado inmediato
- Marca DEV en tests correctos (modo desarrollo)
- Historial de tests aplicados

### Tab 3: Diagnóstico
- Lista de diagnósticos DSM-5 por categoría
- Filtrado por hipótesis actuales
- Confirmación antes de enviar
- Solo se puede enviar uno

### Tab 4: Tratamiento
- Lista de tratamientos (TCC, EMDR, DBT, etc.)
- Solo disponible después de diagnóstico
- Notas adicionales opcionales
- **Enviar → Estado "awaiting_result" con timer**
- **Timer con cuenta regresiva visible**
- **Botón "Ver Resultado" cuando termine el tiempo**

## 9. Sistema de Notificaciones (NUEVO v4.0)

**Notificaciones popup animadas** que aparecen en la parte superior:

| Tipo | Cuándo | Icono | Color |
|------|--------|-------|-------|
| `message` | Fin de sesión de chat | 💬 | Azul |
| `case` | Test/diagnóstico/tratamiento enviado | 📋 | Naranja |
| `result` | Test aplicado | 🧪 | Morado |
| `achievement` | Caso completado exitosamente | 🏆 | Dorado |
| `system` | Errores, caso fallido | ℹ️ | Rojo |

- Auto-dismiss después de 4 segundos
- Clickeable para acción
- Cola de notificaciones si hay varias

## 10. Mecánicas de Juego

### Rapport (solo Realista):
- Barra oculta 0-100
- Afecta: profundidad respuestas, seguir tratamiento
- +puntos: preguntas abiertas, empáticas
- -puntos: cerradas, leading, ignorar info

### Perder partida:
- Insultar / propuestas indecentes
- Reforzar tratamiento incorrecto 3+ veces
- Modo fácil: pierde 1 turno
- Modo difícil: paciente bloquea

### Timer (sesiones 2+):
- 90 segundos sin escribir
- Paciente: "Me puse a hacer cosas, tardaré 20 segundos"

### Tratamientos:
- Principales: TCC, EMDR, DBT, Exposición, etc.
- Complementarios: Mindfulness, meditación, etc.
- Complementarios SOLOS = fallo

### Badge de mensajes no leídos (NUEVO v4.0):
- Incrementa cuando el paciente responde
- Se resetea al abrir el chat
- Aparece como punto rojo en desktop

## 11. PSYKEA y Consulta

### Cámara de la consulta:
- Ver a PSYKAT en su despacho
- Muebles comprados visibles
- Skin equipada visible
- Acciones cambian cada 5 min
- Easter egg: Muy raramente atiende paciente → Logro "PSPIA"

### PSYKEA (tienda):
- Correo de PSYKAT con catálogo adjunto
- Muebles con nombres de psicólogos (Silla Rorschach, Diván Freud)
- Se compran con monedas
- Aparecen en la consulta

## 12. Sistema de Logros

### Por diagnóstico:
- **Iniciado**: 1 caso fácil resuelto
- **Competente**: 1 caso difícil resuelto
- **Experto**: 3 casos difíciles
- **Profesional**: 5 casos realistas

### Especiales:
- Casos colaborativos: Logro aparte
- PSPIA: Ver a PSYKAT atendiendo paciente (oculto)
- Fidelización: Atender paciente recurrente

### Dentro de cada logro:
- Casos resueltos
- Perfil del paciente
- Archivos generados
- Ver conversación completa

## 13. Rankings y Red Social

- Ranking global (mundial)
- Ranking por universidad (#hashtag)
- Casos destacados (graciosos/exitosos)
- Compartir en redes (opcional)

## 14. Monetización

### Free:
- Entrenamiento ilimitado
- Normal: 2 casos/día
- Difícil: 1 caso/día
- Ads en TubeTok

### Premium:
- Todos los modos ilimitados
- Sin ads
- Revisión de caso (modo lectura)
- Skins anticipadas
- Urgencias con XP doble

### Universidades partner:
- Premium gratis para estudiantes

---

## 15. Arquitectura de IA

### Sistema Actual (v1.0)

```
┌─────────────────────────────────────────────┐
│  App PSYKAT (Cliente React Native)          │
│  - API Key en AsyncStorage                  │
│  - Llamadas directas a Groq                 │
│  - Fallback a respuestas locales            │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Groq API (llama-3.1-8b-instant)            │
│  - System prompt contextualizado            │
│  - Historial de conversación (10 msgs)      │
│  - Temperatura según dificultad             │
└─────────────────────────────────────────────┘
```

### Funciones de IA Implementadas
| Función | Estado | Descripción |
|---------|--------|-------------|
| `generateResponse()` | ✅ | Respuestas de paciente en chat |
| `generateFarewellMessage()` | ✅ v4.0 | Despedida automática tras 5 preguntas |
| `detectLifeAspects()` | ✅ | Detectar áreas de vida en mensajes |
| `testConnection()` | ✅ | Verificar conexión a API |
| `generatePatientSeed()` | ❌ | Generar datos de paciente |
| `generateReview()` | ❌ | Feedback post-caso del paciente |
| `generateCaseEmail()` | ❌ | Generar correos de nuevos casos |
| `generateSupervisorFeedback()` | ❌ | Dr. Domingo analiza el caso |

### Sistema Objetivo (v2.0 - Producción)

```
┌─────────────────────────────────────────────┐
│  App PSYKAT (Cliente)                       │
│  - SIN API key en cliente                   │
│  - Autenticación con Supabase               │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Supabase Edge Functions                    │
│  - API Key segura en servidor               │
│  - Rate limiting por usuario/plan           │
│  - Control de costos                        │
│  - Logs para facturación                    │
│  - Caché de respuestas similares            │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Groq API / OpenAI / Anthropic              │
└─────────────────────────────────────────────┘
```

---

## 16. Stack Técnico

| Capa | Tecnología | Estado |
|------|------------|--------|
| Framework | React Native 0.81.5 + Expo 54 | ✅ |
| Lenguaje | TypeScript 5.9.2 | ✅ |
| Estado | Context API + useReducer | ✅ |
| Navegación | React Navigation 7.0 | ✅ |
| Storage | AsyncStorage (v1) | ✅ |
| Storage | Supabase (v2) | ❌ Pendiente |
| IA | Groq API (Llama 3.1) | ✅ |
| Notificaciones | Custom (v1) → Push (v2) | ⚠️ Parcial |
| Build | Expo EAS | ✅ |

---

## 17. Changelog - Historial de Versiones

### v4.0 - Reestructuración Mayor (Diciembre 2024)

**🔥 Cambios Importantes:**

1. **Herramienta Diagnóstica Independiente**
   - Movida fuera del chat a app separada
   - 4 tabs: Hipótesis, Tests, Diagnóstico, Tratamiento
   - Selector de casos (activos/archivados)
   - Timer visible para resultado de tratamiento
   - Verificación de resultado desde la misma app

2. **Chat Simplificado**
   - Eliminados tests y diagnóstico del menú +
   - Solo quedan: Notas y Ver Expediente
   - Enfoque en la conversación terapéutica

3. **Sistema de Notificaciones**
   - Popup animados en la parte superior
   - 5 tipos: message, case, result, achievement, system
   - Auto-dismiss tras 4 segundos
   - Cola de notificaciones

4. **Mail con Tabs**
   - Tab Recibidos: Nuevos casos, swipe to delete
   - Tab Enviados: Tests/diagnósticos/tratamientos por caso

5. **Mensajes Contextuales Mejorados**
   - Saludo del terapeuta diferente en primera sesión vs seguimiento
   - Saludo del paciente específico por trastorno (10+ variantes)
   - Mensajes de despedida automáticos con IA
   - Mensajes de derivación empáticos según contexto

6. **Humor del Secretario PSYKAT**
   - Comentarios específicos por trastorno
   - Comentarios por dificultad del caso
   - Referencias a familia si contactó un familiar
   - Memes internos de psicología
   - Saludos y despedidas variados

7. **Badge de Mensajes No Leídos**
   - Contador de mensajes del paciente
   - Punto rojo en el icono de Mensajería
   - Se resetea al abrir el chat

**Archivos Modificados:**
- `DiagnosticToolScreen.tsx` - Creado desde cero (~1400 líneas)
- `ChatScreen.tsx` - Simplificado y mejorado (~2000 líneas)
- `MailScreen.tsx` - Reestructurado con tabs (~900 líneas)
- `NotificationContext.tsx` - Creado (~310 líneas)
- `AIContext.tsx` - Agregada `generateFarewellMessage`
- `AppContext.tsx` - Agregada acción `MARK_MESSAGES_READ`
- `App.tsx` - Agregado `NotificationProvider`

### v3.0 - Core Funcional (Noviembre 2024)

**Implementaciones:**
- Sistema de chat con IA (Groq)
- Tests psicológicos simulados
- Diagnóstico DSM-5 con % coincidencia
- Sistema de tratamientos
- Timer de espera para resultados
- Generación de pacientes únicos
- Backstories detallados por trastorno
- Sistema de monedas y XP
- DesktopScreen con apps
- ContactsScreen con badges
- Rapport básico (no activo)

### v2.0 - Estructura Base (Octubre 2024)

**Implementaciones:**
- Estructura de navegación
- LockScreen
- DesktopScreen básico
- MailScreen inicial
- Integración básica con IA

### v1.0 - Prototipo (Septiembre 2024)

**Implementaciones:**
- Concepto inicial
- Diseño de personajes
- Arquitectura técnica

---

## 18. Estado Actual del Proyecto

### Fase 1: Core Funcional (v4.0) - 95% Completado ✅

| Tarea | Estado | Notas |
|-------|--------|-------|
| Estructura del proyecto | ✅ | React Native + TypeScript |
| MailScreen con tabs | ✅ | Recibidos/Enviados |
| ContactsScreen | ✅ | Lista alfabética, badges |
| ChatScreen simplificado | ✅ | Solo Notas + Expediente |
| **DiagnosticToolScreen** | ✅ | **App separada con 4 tabs** |
| **Sistema de notificaciones** | ✅ | **Popup animados** |
| Integrar Groq | ✅ | Con fallback local |
| **Mensajes contextuales** | ✅ | **Por trastorno y sesión** |
| **Humor del secretario** | ✅ | **Comentarios contextuales** |
| **Badge mensajes no leídos** | ✅ | **Desktop + reset al abrir** |
| Sistema de monedas | ✅ | Ganancia/gasto funcional |
| Baterías de tests | ✅ | PHQ-9, GAD-7, etc. (simulados) |
| Sistema de espera tratamiento | ✅ | Timer con UI completa |
| **Verificación de resultado** | ✅ | **Desde DiagnosticTool** |
| ResultsScreen | ⚠️ 50% | Básico, falta mejorar |

### Fase 2: Gamificación (v1.5) - No iniciado

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| App Consulta | ❌ | Media |
| PSYKEA (tienda) | ❌ | Media |
| Skins del gato | ❌ | Baja |
| Sistema de logros | ❌ | Alta |
| Estadísticas usuario | ❌ | Media |
| Modo Entrenamiento mejorado | ❌ | Alta |
| Sistema de urgencias | ❌ | Baja |
| Pacientes recurrentes | ❌ | Media |

### Fase 3: Contenido Especial (v2.0) - No iniciado

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Modo Histórico (agencias) | ❌ | Baja |
| Nombres aleatorios IA | ❌ | Baja |
| Biblioteca de casos | ⚠️ Parcial | Media |
| Caso colaborativo | ❌ | Baja |
| Rankings | ❌ | Media |
| Supabase Auth + Sync | ❌ | **CRÍTICA** |
| Multi-idioma | ❌ | Baja |

### Fase 4: Pulido (v2.5) - No iniciado

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Onboarding/Tutorial | ❌ | Alta |
| Logro PSPIA | ❌ | Baja |
| Accesibilidad completa | ❌ | Media |
| Exportar PDF | ❌ | Media |
| Modo examen | ❌ | Baja |
| Refinar ResultsScreen | ❌ | Alta |

---

## 19. Tareas Pendientes (To-Do)

### 🔴 Críticas (resolver antes de producción)
1. **Migrar API Key a backend** - Actualmente hardcodeada en `AIContext.tsx`
2. **DEV_MODE activo** - Monedas infinitas, level 10, timer 5s
3. **Implementar Supabase Auth** - Sistema de usuarios y persistencia
4. **Push notifications reales** - Sistema actual es solo in-app

### 🟡 Importantes
1. **Mejorar ResultsScreen** - Feedback más detallado y visual
2. **Sistema de logros completo** - Tracking de progreso
3. **Tutorial/Onboarding** - Para nuevos usuarios
4. **Validar límites de casos** - Máximo según modo
5. **Rapport activo** - Que afecte realmente las respuestas

### 🟢 Mejoras
1. Logging estructurado para debugging
2. Retry logic en errores de IA
3. Caché de respuestas frecuentes
4. Modo offline básico
5. Animaciones de transición mejoradas
6. Tests unitarios
7. Exportar PDF del caso completo

---

## 20. Problemas Conocidos

### Críticos
1. **API Key expuesta** - Cualquiera con acceso al código puede ver la key de Groq
2. **DEV_MODE activo** - Timer de tratamiento en 5 segundos (debería ser 2 días)
3. **Sin rate limiting** - Posible abuso de la API

### Importantes
1. Timer de tratamiento en segundos (debe ser días en producción)
2. Sistema de rapport existe pero no afecta respuestas del paciente
3. Límites de casos simultáneos no validados
4. Sin manejo de errores de red robusto

### Menores
1. Tipos de TypeScript: `react-native-vector-icons` sin declaraciones
2. Algunos estilos inline deberían estar en StyleSheet
3. Sin tests automatizados
4. Falta documentación de código inline

---

## 21. Estructura del Proyecto

```
PSYKAT3.0/
├── README.md                    # Este archivo (actualizado v4.0)
├── CHANGELOG.md                 # Historial detallado de cambios
├── N8N_INTEGRATION.md          # Guía alternativa n8n
└── react/
    ├── App.tsx                  # Root navigator + NotificationProvider
    ├── package.json             # Dependencies
    ├── tsconfig.json            # TypeScript config
    ├── app.json                 # Expo config
    └── src/
        ├── contexts/
        │   ├── AppContext.tsx          # Estado global + MARK_MESSAGES_READ
        │   ├── AIContext.tsx           # IA + generateFarewellMessage
        │   └── NotificationContext.tsx # Sistema de notificaciones (NUEVO)
        ├── types/
        │   ├── index.ts         # Tipos principales
        │   └── navigation.ts    # Tipos de navegación
        ├── data/
        │   ├── mockData.ts      # Backstories, saludos contextuales
        │   └── clinicalData.ts  # DSM-5, síntomas, tests
        └── screens/
            ├── LockScreen.tsx
            ├── DesktopScreen.tsx        # + Badge de mensajes no leídos
            ├── MessagingScreen.tsx
            ├── ChatScreen.tsx           # Simplificado + mensajes contextuales
            ├── MailScreen.tsx           # Reestructurado con tabs
            ├── ContactsScreen.tsx
            ├── DiagnosisScreen.tsx      # (Legacy, reemplazado)
            ├── DiagnosticToolScreen.tsx # NUEVO - App separada con 4 tabs
            ├── TreatmentScreen.tsx      # (Legacy, funcionalidad movida)
            ├── PsykTokScreen.tsx
            ├── DiaryScreen.tsx
            ├── SettingsScreen.tsx
            └── ResultsScreen.tsx
```

---

## 22. Instalación y Desarrollo

```bash
# Clonar repositorio
git clone <repo-url>
cd PSYKAT3.0/react

# Instalar dependencias
npm install

# Iniciar en desarrollo
npx expo start

# Para iOS
npx expo start --ios

# Para Android
npx expo start --android

# Limpiar caché si hay problemas
npx expo start --clear
```

### Variables de Entorno

Crear archivo `.env` en `react/`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

**⚠️ IMPORTANTE**: No committear la API key al repositorio.

---

## 23. Testing

```bash
# Compilación TypeScript (sin emitir archivos)
npx tsc --noEmit

# Verificar linting
npx eslint src/

# Tests (cuando estén implementados)
npm test
```

---

## 24. Deployment

```bash
# Build para iOS
eas build --platform ios

# Build para Android
eas build --platform android

# Build para ambas plataformas
eas build --platform all
```

---

## 25. Contribuciones

### Estilo de Código
- TypeScript estricto
- Functional components con hooks
- Context API para estado global
- Comentarios solo cuando sea necesario
- Nombres descriptivos en español para UX, inglés para código

### Convenciones de Commits
```
feat: nueva funcionalidad
fix: corrección de bug
refactor: refactorización sin cambios funcionales
docs: documentación
style: formato, espacios, etc
test: añadir tests
chore: mantenimiento
```

---

## 26. Contacto y Soporte

- Issues: GitHub Issues
- Documentación: Este README + archivos en `/docs`
- Comunidad: [Enlace cuando esté disponible]

---

## 27. Roadmap Futuro

### Q1 2025 - Producción v1.0
- [ ] Migrar API a Supabase Edge Functions
- [ ] Implementar autenticación
- [ ] Sistema de logros completo
- [ ] Tutorial/Onboarding
- [ ] Mejorar ResultsScreen
- [ ] Tests automatizados
- [ ] Beta cerrada

### Q2 2025 - Gamificación v1.5
- [ ] App Consulta + PSYKEA
- [ ] Sistema de skins
- [ ] Modo urgencias
- [ ] Estadísticas detalladas
- [ ] Beta abierta

### Q3 2025 - Contenido v2.0
- [ ] Modo Histórico con agencias
- [ ] Rankings y red social
- [ ] Casos colaborativos
- [ ] Multi-idioma (inglés)
- [ ] Launch público

### Q4 2025 - Expansión v2.5
- [ ] Partnerships con universidades
- [ ] Versión web
- [ ] API pública
- [ ] Comunidad de casos compartidos

---

## 28. Licencia

Proyecto educativo - No comercial
© 2024-2025 PSYKAT - Mobile Therapist Simulator

---

## 29. Agradecimientos

- **Groq** por la API de IA de alta velocidad
- **Expo** por simplificar el desarrollo React Native
- **React Navigation** por el sistema de navegación
- Comunidad de psicología clínica por el feedback

---

**Nota**: Esta aplicación es una herramienta de entrenamiento y no debe usarse como sustituto de la evaluación clínica profesional. Todos los casos son ficticios y diseñados exclusivamente para fines educativos.

**Última actualización**: Diciembre 2024 - v4.0
