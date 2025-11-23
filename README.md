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

## 6. Flujo de un Caso

1. Correo de PSYKAT/Agencia → genera seed del paciente
2. "Añadir a contactos" → paciente en lista
3. Tap contacto → abre chat → mensajes auto de saludo
4. 5 preguntas por sesión
5. Fin sesión → acceso a herramientas
6. Herramientas: Diagnóstico, Tests, Notas
7. Enviar test → nueva sesión → resultados
8. Diagnóstico final → enviar informe
9. Se desbloquea Tratamiento
10. Seleccionar tratamiento → enviar documento
11. Chat bloqueado → esperar 2 días reales
12. Notificación: paciente responde
13. Si correcto → review → logro
14. Si incorrecto → ajustar o perder

## 7. Interfaz del Chat

```
┌─────────────────────────────────┐
│ ←  |      Ana Martínez     | 👤 │
├─────────────────────────────────┤
│                                 │
│     [Burbujas de chat]          │
│                                 │
├─────────────────────────────────┤
│  ⊕  (__________________)        │
└─────────────────────────────────┘
```

### Swipe izquierda (menú paciente):
- Información del paciente
- Resumen del caso
- Notas (añadir/ver)
- Marcar como síntoma
- Historial rápido
- Ayuda (solo Normal/Entrenamiento)

### Botón "+" (herramientas):
- 🔍 Herramienta Diagnóstica
- 📋 Herramienta de Tests
- 📝 Notas
- 💊 Tratamiento (tras diagnóstico)

### Tap en foto del paciente:
- Ver info de contacto completa
- Anular caso

## 8. Mecánicas de Juego

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

## 9. PSYKEA y Consulta

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

## 10. Sistema de Logros

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

## 11. Rankings y Red Social

- Ranking global (mundial)
- Ranking por universidad (#hashtag)
- Casos destacados (graciosos/exitosos)
- Compartir en redes (opcional)

## 12. Monetización

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

## 13. Arquitectura de IA

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

### Prompts por Mecánica

| Mecánica | Tipo de Prompt | Prioridad |
|----------|---------------|-----------|
| Chat paciente | Roleplay inmersivo | ✅ Implementado |
| Generación de seeds | Creación de personaje | Alta |
| Reviews post-caso | Evaluación emocional | Alta |
| Correos/casos nuevos | Escritura formal | Media |
| Dr. Domingo feedback | Análisis clínico | Media |

---

## 14. Stack Técnico

| Capa | Tecnología | Estado |
|------|------------|--------|
| Framework | React Native 0.81.5 + Expo 54 | ✅ |
| Lenguaje | TypeScript 5.9.2 | ✅ |
| Estado | Context API + useReducer | ✅ |
| Navegación | React Navigation 7.0 | ✅ |
| Storage | AsyncStorage (v1) | ✅ |
| Storage | Supabase (v2) | ❌ Pendiente |
| IA | Groq API (Llama 3.1) | ✅ |
| Build | Expo EAS | ✅ |

---

## 15. Estado Actual del Proyecto

### Fase 1: Core Funcional (v1.0) - 85% Completado

| Tarea | Estado | Notas |
|-------|--------|-------|
| Estructura del proyecto | ✅ | React Native + TypeScript |
| MailScreen | ✅ | Casos por dificultad, agencias |
| ContactsScreen | ✅ | Lista alfabética, badges |
| ChatScreen | ✅ | Chat con IA, 5 preguntas/sesión |
| Integrar Groq | ✅ | Con fallback local |
| Sistema de monedas | ✅ | Ganancia/gasto funcional |
| Baterías de tests | ✅ | PHQ-9, GAD-7, etc. (simulados) |
| Herramienta Diagnóstico | ✅ | DSM-5-TR con % coincidencia |
| Herramienta Tratamiento | ✅ | Selección y envío |
| Sistema de espera | ✅ | Timer implementado (5s dev) |
| **ResultsScreen** | ⚠️ 30% | Review básica, falta completar |

### Fase 2: Gamificación (v1.5) - No iniciado

| Tarea | Estado |
|-------|--------|
| App Consulta | ❌ |
| PSYKEA (tienda) | ❌ |
| Skins del gato | ❌ |
| Sistema de logros | ❌ |
| Estadísticas usuario | ❌ |
| Modo Entrenamiento mejorado | ❌ |
| Sistema de urgencias | ❌ |
| Pacientes recurrentes | ❌ |

### Fase 3: Contenido Especial (v2.0) - No iniciado

| Tarea | Estado |
|-------|--------|
| Modo Histórico (agencias) | ❌ |
| Nombres aleatorios IA | ❌ |
| Biblioteca de casos | ⚠️ Parcial |
| Caso colaborativo | ❌ |
| Rankings | ❌ |
| Supabase Auth + Sync | ❌ |
| Multi-idioma | ❌ |

### Fase 4: Pulido (v2.5) - No iniciado

| Tarea | Estado |
|-------|--------|
| Onboarding/Tutorial | ❌ |
| Logro PSPIA | ❌ |
| Accesibilidad completa | ❌ |
| Exportar PDF | ❌ |
| Modo examen | ❌ |

---

## 16. Problemas Conocidos

### Críticos (resolver antes de producción)
1. **API Key hardcodeada** en `AIContext.tsx:14` - Debe migrarse a backend
2. **DEV_MODE activo** en `AppContext.tsx` - Monedas infinitas, level 10

### Importantes
1. Timer de tratamiento en 5 segundos (debe ser 2 días en prod)
2. Sistema de rapport existe pero no afecta activamente las respuestas
3. Límites de casos simultáneos no validados contra máximos

### Mejoras Pendientes
1. Logging estructurado para debugging
2. Retry logic en errores de IA
3. Caché de respuestas frecuentes
4. Notificaciones push reales

---

## 17. Estructura del Proyecto

```
PSYKAT3.0/
├── README.md                    # Este archivo
├── N8N_INTEGRATION.md          # Guía alternativa n8n
└── react/
    ├── App.tsx                  # Root navigator
    ├── package.json             # Dependencies
    ├── tsconfig.json            # TypeScript config
    ├── app.json                 # Expo config
    └── src/
        ├── contexts/
        │   ├── AppContext.tsx   # Estado global
        │   └── AIContext.tsx    # Integración IA
        ├── types/
        │   ├── index.ts         # Tipos principales
        │   └── navigation.ts    # Tipos de navegación
        ├── data/
        │   ├── mockData.ts      # Backstories, saludos
        │   └── clinicalData.ts  # DSM-5, síntomas, tests
        └── screens/
            ├── LockScreen.tsx
            ├── DesktopScreen.tsx
            ├── MessagingScreen.tsx
            ├── ChatScreen.tsx
            ├── MailScreen.tsx
            ├── ContactsScreen.tsx
            ├── DiagnosisScreen.tsx
            ├── TreatmentScreen.tsx
            ├── PsykTokScreen.tsx
            ├── DiaryScreen.tsx
            ├── SettingsScreen.tsx
            └── ResultsScreen.tsx
```

---

## 18. Instalación y Desarrollo

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
```

---

## 19. Licencia

Proyecto educativo - No comercial
© 2024-2025 PSYKAT - Mobile Therapist Simulator

---

**Nota**: Esta aplicación es una herramienta de entrenamiento y no debe usarse como sustituto de la evaluación clínica profesional. Todos los casos son ficticios y diseñados exclusivamente para fines educativos.
