# Integración PSYKAT con n8n

## 📋 Descripción

Esta guía explica cómo integrar PSYKAT con n8n para obtener respuestas de IA real en lugar de las respuestas simuladas por defecto.

## 🔧 Configuración de n8n

### 1. Instalación de n8n

**Opción A: Docker (Recomendado)**
```bash
# Crear carpeta para datos
docker volume create n8n_data

# Ejecutar n8n
docker run -it --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n
```

**Opción B: npm**
```bash
# Instalar n8n globalmente
npm install -g n8n

# Ejecutar n8n
n8n
```

La interfaz estará disponible en: `http://localhost:5678`

### 2. Crear el Workflow de PSYKAT

#### Paso 1: Crear nuevo workflow
1. Abre n8n en tu navegador
2. Crea un nuevo workflow
3. Añade los siguientes nodos:

#### Paso 2: Nodo Webhook
- **Tipo**: Webhook
- **Nombre**: PSYKAT Webhook
- **Configuración**:
  - Método HTTP: POST
  - Path: `/webhook/ask`
  - Response Mode: "Response to Webhook"

#### Paso 3: Nodo Function (Procesamiento)
- **Tipo**: Function
- **Nombre**: Procesar Pregunta
- **Código**:

```javascript
// Obtener datos del webhook
const { 
    doctorQuestion, 
    patientName, 
    disorder, 
    personality, 
    symptoms, 
    mode, 
    conversationHistory,
    questionCount 
} = items[0].json;

// Analizar la pregunta del doctor
function analyzeQuestion(question) {
    const analysis = {
        isOpenEnded: /^(cómo|qué|cuándo|dónde|por qué|cuéntame|descríbeme|explícame)/i.test(question),
        isEmpathic: /(debe ser difícil|imagino que|entiendo que|debe doler|te comprendo)/i.test(question),
        isClosed: /^(¿tienes|¿has|¿eres)/i.test(question),
        isLeading: /(¿no crees que|¿no te parece que|¿verdad que|supongo que)/i.test(question),
        asksAboutWork: /(trabajo|jefe|oficina|empleo)/i.test(question),
        asksAboutFamily: /(familia|hijos|padre|madre|esposo|esposa)/i.test(question),
        asksAboutSymptoms: /(siente|síntomas|dolor|malestar)/i.test(question),
        asksAboutChildhood: /(infancia|niño|pequeño|padre|madre)/i.test(question)
    };
    
    return analysis;
}

// Generar respuesta basada en el trastorno y personalidad
function generateResponse(question, analysis) {
    const responses = {
        'depresion_mayor': {
            work: [
                "El trabajo se ha vuelto muy pesado últimamente...",
                "Mi jefe no entiende lo que estoy pasando",
                "Me cuesta concentrarme en mis tareas"
            ],
            family: [
                "Siento que no soy el padre/madre que debería ser",
                "Mi hija me preguntó por qué estaba triste",
                "La relación con mi familia se ha vuelto difícil"
            ],
            general: [
                "No encuentro motivación para nada",
                "Me siento vacío/a por dentro",
                "He perdido interés en las cosas que antes me gustaban",
                "No veo futuro, todo parece gris",
                "Me despierto cansado/a incluso después de dormir"
            ]
        },
        'trastorno_ansiedad_generalizada': {
            work: [
                "Estoy constantemente preocupado por el trabajo",
                "Me preocupa que no esté haciendo bien mi trabajo",
                "Mi jefe me presiona mucho"
            ],
            general: [
                "Estoy constantemente preocupado por todo",
                "No puedo controlar mis pensamientos negativos",
                "Me angustia pensar en el futuro",
                "Mi cuerpo está siempre tenso",
                "No puedo dormir bien por la ansiedad"
            ]
        },
        'trastorno_pánico': {
            general: [
                "Tengo ataques de pánico sin razón aparente",
                "Me da miedo que vuelva a pasar",
                "Evito lugares donde antes tuve un ataque",
                "Mi corazón late muy fuerte a veces",
                "Siento que me voy a morir cuando me da"
            ]
        }
    };
    
    const disorderResponses = responses[disorder] || responses['depresion_mayor'];
    
    let responsePool;
    if (analysis.asksAboutWork && disorderResponses.work) {
        responsePool = disorderResponses.work;
    } else if (analysis.asksAboutFamily && disorderResponses.family) {
        responsePool = disorderResponses.family;
    } else {
        responsePool = disorderResponses.general || disorderResponses.general;
    }
    
    // Añadir variación basada en la personalidad
    let response = responsePool[Math.floor(Math.random() * responsePool.length)];
    
    if (personality === 'reservado') {
        response = response.replace(/muy|mucho/gi, 'bastante');
    } else if (personality === 'ansioso') {
        response = response + '... no sé qué hacer';
    }
    
    return response;
}

// Calcular score de calidad de la pregunta
function calculateScore(question, analysis, mode) {
    let score = 50; // Puntuación base
    
    if (analysis.isOpenEnded) score += 20;
    if (analysis.isEmpathic) score += 15;
    if (analysis.isClosed) score -= 15;
    if (analysis.isLeading) score -= 20;
    
    // Bonus por profundidad
    if (analysis.asksAboutChildhood) score += 25;
    if (analysis.asksAboutFamily) score += 15;
    
    // Modificadores por modo
    const multipliers = {
        entrenamiento: 1.2,
        dificil: 1.0,
        realista: 0.8
    };
    
    score *= (multipliers[mode] || 1.0);
    
    return Math.max(0, Math.min(100, Math.round(score)));
}

// Analizar pregunta
const analysis = analyzeQuestion(doctorQuestion);

// Generar respuesta
const response = generateResponse(doctorQuestion, analysis);

// Calcular score
const score = calculateScore(doctorQuestion, analysis, mode);

// Determinar color basado en score
let color = 'brown';
if (score >= 80) color = 'green';
else if (score >= 60) color = 'blue';
else if (score >= 40) color = 'purple';

// Construir respuesta final
const result = {
    response: response,
    score: score,
    color: color,
    analysis: {
        isOpenEnded: analysis.isOpenEnded,
        isEmpathic: analysis.isEmpathic,
        isClosed: analysis.isClosed,
        isLeading: analysis.isLeading,
        asksAboutWork: analysis.asksAboutWork,
        asksAboutFamily: analysis.asksAboutFamily,
        asksAboutSymptoms: analysis.asksAboutSymptoms
    },
    metadata: {
        disorder: disorder,
        personality: personality,
        mode: mode,
        questionCount: questionCount,
        timestamp: new Date().toISOString()
    }
};

// Guardar en variable para el siguiente nodo
$node.result = result;

// Devolver resultado
return [result];
```

#### Paso 4: Nodo Respond to Webhook
- **Tipo**: Respond to Webhook
- **Nombre**: Enviar Respuesta
- **Configuración**:
  - Options → Add Option → Response Data: "Using 'Respond to Webhook' Node"
  - Respond With: "JSON"

### 3. Configuración del Webhook

El webhook debe estar configurado para recibir:

```json
{
  "doctorQuestion": "string",
  "patientName": "string", 
  "disorder": "string",
  "personality": "string",
  "symptoms": ["string"],
  "mode": "string",
  "caseFileData": {},
  "conversationHistory": [],
  "sessionId": "string",
  "questionCount": "number"
}
```

Y responderá con:

```json
{
  "response": "string",
  "score": "number",
  "color": "string",
  "analysis": {},
  "metadata": {}
}
```

## 🚀 Configuración en PSYKAT

### 1. Activar modo n8n

En el archivo `config.js`:

```javascript
ai: {
    mode: 'n8n', // Cambiar de 'local' a 'n8n'
    n8nEndpoint: 'http://localhost:5678/webhook/ask'
}
```

### 2. Configuración dinámica

La aplicación ahora incluye una interfaz de configuración:

1. Abre la aplicación PSYKAT
2. Ve a Ajustes → Configuración de IA
3. Selecciona "n8n" como modo de IA
4. Ingresa el endpoint de tu webhook
5. Haz clic en "Probar conexión"
6. Guarda la configuración

## 📊 Monitoreo y Debugging

### Logs en n8n

El workflow debería incluir logging para debugging:

```javascript
// Añadir al nodo Function
console.log('Pregunta recibida:', doctorQuestion);
console.log('Análisis:', analysis);
console.log('Respuesta generada:', response);
console.log('Score calculado:', score);
```

### Métricas de calidad

Puedes añadir métricas al workflow:

```javascript
// Métricas de calidad de la interacción
const metrics = {
    sessionId: sessionId,
    questionNumber: questionCount,
    questionQuality: score,
    questionType: analysis.isOpenEnded ? 'open' : analysis.isClosed ? 'closed' : 'mixed',
    topic: analysis.asksAboutWork ? 'work' : analysis.asksAboutFamily ? 'family' : 'general',
    responseLength: response.length,
    timestamp: new Date().toISOString()
};

// Enviar a tu sistema de analytics
// analytics.track('patient_interaction', metrics);
```

## 🔄 Alternativas a n8n

Si prefieres no usar n8n, aquí tienes algunas alternativas:

### 1. **API personalizada con Express.js**

```javascript
// server.js
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/ask', async (req, res) => {
    const { doctorQuestion, patientData } = req.body;
    
    // Tu lógica de IA aquí
    const response = await generateAIResponse(doctorQuestion, patientData);
    
    res.json(response);
});

app.listen(3000, () => {
    console.log('PSYKAT API running on port 3000');
});
```

### 2. **Uso directo de APIs de IA**

```javascript
// Integración directa con OpenAI
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function generateResponse(prompt, patientContext) {
    const response = await openai.createCompletion({
        model: "gpt-3.5-turbo",
        prompt: `Eres un paciente con ${patientContext.disorder}. ${prompt}`,
        max_tokens: 150,
        temperature: 0.7,
    });
    
    return response.data.choices[0].text;
}
```

### 3. **Uso de modelos locales**

```javascript
// Con Ollama o similar
const { Ollama } = require('ollama');

const ollama = new Ollama({
    host: 'http://localhost:11434'
});

async function generateLocalResponse(prompt, context) {
    const response = await ollama.generate({
        model: 'llama2',
        prompt: `Contexto: ${context}\nPregunta: ${prompt}\nRespuesta:`,
        stream: false
    });
    
    return response.response;
}
```

## 🎯 Mejores Prácticas

### 1. **Gestión de errores**

```javascript
try {
    const response = await fetch(n8nEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    return await response.json();
} catch (error) {
    console.error('Error con n8n:', error);
    // Fallback a respuesta local
    return generateLocalResponse(payload);
}
```

### 2. **Rate limiting**

```javascript
class RateLimiter {
    constructor(maxRequests = 10, windowMs = 60000) {
        this.requests = [];
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }
    
    canMakeRequest() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        
        if (this.requests.length >= this.maxRequests) {
            return false;
        }
        
        this.requests.push(now);
        return true;
    }
}
```

### 3. **Caché de respuestas**

```javascript
class ResponseCache {
    constructor(ttl = 300000) { // 5 minutos
        this.cache = new Map();
        this.ttl = ttl;
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    set(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }
}
```

## 📈 Optimización para producción

### 1. **Escalabilidad**
- Usa Redis para caché distribuida
- Implementa colas de mensajes para procesamiento asíncrono
- Considera usar Kubernetes para orquestación

### 2. **Seguridad**
- Implementa autenticación en el webhook
- Usa HTTPS en producción
- Valida y sanitiza todas las entradas

### 3. **Monitoreo**
- Añade logs estructurados
- Implementa métricas de Prometheus
- Usa APM (Application Performance Monitoring)

## 🎉 Conclusión

La integración con n8n proporciona una forma flexible y potente de conectar PSYKAT con sistemas de IA reales. La configuración es relativamente simple y permite:

- ✅ Respuestas más realistas y contextuales
- ✅ Análisis de calidad de preguntas
- ✅ Integración con múltiples proveedores de IA
- ✅ Monitoreo y métricas detalladas
- ✅ Escalabilidad y mantenibilidad

## 📞 Soporte

Si tienes problemas con la integración:

1. Verifica que n8n esté ejecutándose
2. Comprueba el endpoint del webhook
3. Revisa los logs de n8n
4. Prueba la conexión con herramientas como Postman
5. Consulta la documentación de n8n

## 📄 Licencia

Este sistema de integración es parte del proyecto PSYKAT y está disponible para uso educativo y comercial según los términos del proyecto principal.