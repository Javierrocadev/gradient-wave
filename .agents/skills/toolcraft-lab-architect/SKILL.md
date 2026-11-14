---
name: toolcraft-lab-architect
description: "Trigger: nuevo laboratorio, crear prompt de laboratorio, visual lab prompt, generar app toolcraft, nuevo proyecto procedural. Diseña y genera prompts por fases para crear laboratorios visuales e interactivos en Toolcraft."
license: Apache-2.0
metadata:
  author: "toolcraft-community"
  version: "1.0"
---

## Activation Contract

Activa esta skill cuando:
- El usuario quiera iniciar un nuevo laboratorio visual, generador de motion graphics, canvas interactivo o experimento procedimental (ej. ondas, partículas, gradientes fluidos, mallas 3D, tipografía cinética).
- El usuario pida redactar o estructurar el **prompt maestro por fases** para que un agente de IA construya la aplicación paso a paso sin reescrituras ni alucinaciones.
- Se necesite convertir una idea informal ("quiero un card con gotas de blur y ondas en relieve...") en una especificación ejecutable compatible con Toolcraft.

## Hard Rules

1. **Estructura en Fases Independientes**: El prompt resultante NUNCA debe ser un bloque monolítico. Debe dividirse en fases numeradas (Fase 0 a Fase 5) donde cada fase tenga su propio bloque de prompt ejecutable y su **Criterio de Aceptación observable**.
2. **Shared Context Header Obligatorio**: Cada fase debe incluir una cabecera de contexto compartido con las restricciones globales (sin login, loop continuo, desktop-only, compatibilidad con Toolcraft runtime).
3. **Fase 0 sin UI**: La Fase 0 SIEMPRE congela el modelo matemático (`model.ts`), el esquema tipado (`schema.ts`) y el reloj de loop (`t: 0..1`). No se crea interfaz de usuario hasta que el motor determinista esté probado.
4. **Loop "Seamless" Determinista**: El tiempo debe normalizarse en `t ∈ [0, 1)`. La función de renderizado debe garantizar matemáticamente que el frame `t = 1.0` conecte de forma idéntica y continua con `t = 0.0` sin pausas ni duplicaciones de fotogramas.
5. **Alineación con Toolcraft**: El prompt debe apoyarse en la arquitectura nativa del repositorio (`src/app/app-schema.ts`, `src/app/app-defaults.json`, `src/app/app-acceptance-data.ts`, motor de exportación y suite de Playwright), evitando reinventar frameworks de UI paralelos.

## Decision Gates

| Necesidad de renderizado | Decisión técnica en el prompt |
|---|---|
| Líneas vectoriales, curvas Bézier, trazados analíticos | **2D Canvas API** o SVG puro (`ctx.bezierCurveTo`) |
| Luces difusas, halos, grano, relieve, post-procesado | **Shader Canvas / Canvas 2D multi-pass** con offscreen buffers |
| Geometría 3D, partículas masivas, mallas deformables | **Three.js / WebGL / WebGPU** montado en el contenedor de preview |
| Edición espacial directa en el canvas | Control personalizado tipo **VectorScreen** o manejadores sobre el lienzo |
| Modulación temporal | **Timeline** acoplado al reloj global con scrubbing y exportador por frames |

## Execution Steps

1. **Captura del Concepto**: Identifica la entidad visual principal (partículas, ondas, cintas, tipografía), la estética deseada (colores, fondos, grano, relieve) y el propósito (exportación de fondos de video, stickers animados, covers).
2. **Definición de Controles Clave**: Selecciona de 5 a 10 parámetros de alto impacto (ej. frecuencia, amplitud, espaciado, número de elementos, velocidad, paleta de color, estilo de renderizado).
3. **Cálculo del Loop**: Define la fórmula o estrategia matemática que asegura el loop continuo (funciones periódicas con armónicos enteros $2\pi k \cdot t$, ruido simplex en anillo circular 4D, rotación modular).
4. **Generación del Prompt por Fases**: Instancia la plantilla que se encuentra en `references/lab-prompt-template.md`, sustituyendo los marcadores con la identidad y detalles del nuevo laboratorio.
5. **Revisión de Coherencia**: Verifica que los nombres de archivo (`src/app/{nombre}-model.ts`, `src/app/{nombre}-renderer.tsx`) y los criterios de aceptación sean precisos y verificables por Playwright.

## Output Contract

Devuelve al usuario:
- **Resumen Ejecutivo**: Propósito y arquitectura visual seleccionada (2D Canvas, Three.js, shaders).
- **Prompt Maestro por Fases**: Formateado en Markdown limpio con su *Shared Context Header* y las fases 0 a 5 listas para copiar y pegar o ejecutar.
- **Instrucciones de Uso**: Guía de cómo lanzar la primera fase en una nueva rama del proyecto.

## References

- Plantilla maestra de prompt por fases: [lab-prompt-template.md](file:///C:/Users/javie/Documents/Mis%20proyectos/gradient-wave/.agents/skills/toolcraft-lab-architect/references/lab-prompt-template.md)
