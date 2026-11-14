# Plantilla Maestra: Generador de Laboratorios Visuales Interactivos (Toolcraft)

Esta plantilla se utiliza para estructurar cualquier nuevo proyecto o rama de Toolcraft (ondas, partículas, mallas 3D, generadores de ruido, cintas de gradiente, etc.). 
Cada fase es un prompt independiente y autocontenido que se entrega secuencialmente a un agente de desarrollo.

---

```markdown
# [NOMBRE DEL PROYECTO]: Laboratorio Visual Interactivo

Un estudio web para diseñar, manipular y exportar [DESCRIPCIÓN DEL EFECTO VISUAL: ej. gradientes fluidos en relieve / mallas geométricas / campos de partículas / cintas vectoriales].
Este documento contiene todo lo necesario para construir **[NOMBRE DEL PROYECTO]** en fases ordenadas, donde cada fase es un prompt autocontenido y comprobable.

---

### Instrucciones de uso

1. Construir las fases **en orden estricto (0 a 5)**. Cada fase debe producir una aplicación funcional y verificada antes de pasar a la siguiente.
2. **Anteponer siempre el "Shared Context Header"** al inicio de cada prompt de fase para que el agente mantenga todas las restricciones globales.
3. **La Fase 0 es el cimiento:** Define el modelo matemático determinista, el esquema de datos y el reloj de animación, previniendo reescrituras posteriores.
4. Tras cada fase, ejecuta la comprobación de aceptación antes de continuar.

---

### Shared Context Header
*(Pegar este bloque al inicio del prompt de cada fase)*

Estás construyendo **[NOMBRE DEL PROYECTO]**, una aplicación web de escritorio basada en Toolcraft: un laboratorio interactivo donde el usuario personaliza mediante controles en tiempo real un efecto procedural de [DESCRIPCIÓN BREVE], lo visualiza en un lienzo animado con loop infinito y lo exporta como video o imagen fija de alta resolución.

**Restricciones globales del proyecto:**
- **Sin cuentas ni backend:** Todo el estado vive en la sesión del navegador y se sincroniza con el esquema Toolcraft (`src/app/app-schema.ts`).
- **Escritorio primero:** Enfoque en pantalla completa de escritorio con panel de controles lateral y viewport central.
- **Loop Seamless Obligatorio:** Toda animación es un bucle continuo periódico. El tiempo normalizado `t` corre de `0` a `1`. El fotograma final debe conectar de forma idéntica e imperceptible con el primer fotograma (sin saltos de velocidad ni duplicaciones).
- **Arquitectura desacoplada:** El modelo de cálculo (`src/app/[proyecto]-model.ts`) es código TypeScript puro y determinista, completamente separado del renderizado visual (`src/app/[proyecto]-renderer.tsx`).
- **Verificación rigurosa:** Cada cambio debe compilar con TypeScript sin errores (`npm run typecheck`) y mantener la integridad del framework.

---

### Fase 0: Arquitectura, Modelo Matemático y Esquema de Estado

**Objetivo:** Establecer el esqueleto del proyecto, el esquema de configuración fuertemente tipado (Zod), el modelo matemático determinista y el bucle de reloj temporal (`t: 0..1`). **No construir interfaz de usuario todavía.**

**Prompt:**
> [Shared Context Header]
>
> Esta es la **Fase 0**. Establece la base matemática y de datos del proyecto sin construir aún controles complejos de interfaz.
>
> 1. **Definir el Esquema de Configuración (`src/app/app-schema.ts`):**
>    - Crea el esquema Zod estructurado por secciones lógicas:
>      - `geometry`: Parámetros de forma (ej. cantidad de elementos, densidad, radio, curvatura, amplitud, frecuencia).
>      - `appearance`: Parámetros estéticos (ej. paleta de colores, modo de estilo, opacidad, rugosidad, grano).
>      - `motion`: Parámetros de animación (ej. velocidad, dirección, modulación de fase).
>    - Exporta los valores predeterminados en `src/app/app-defaults.json`.
>
> 2. **El Reloj y Motor de Cálculo (`src/app/[proyecto]-model.ts`):**
>    - Implementa una función pura:
>      `evaluate(state: AppState, t: number, helpers: MathHelpers): GeneratedGeometry`
>    - El tiempo normalizado `t` va de `0` a `1`.
>    - Asegura que para cualquier valor $x$, las funciones periódicas cumplan $f(t=0) = f(t=1)$ y $f'(t=0) = f'(t=1)$ para garantizar suavidad de velocidad.
>    - Provee helpers matemáticos puros (`sin`, `cos`, `lerp`, `smoothstep`, `TAU = Math.PI * 2`).
>
> 3. **Lienzo Esqueleto:**
>    - Configura el componente de lienzo básico en `src/app/[proyecto]-renderer.tsx` conectado al reloj de animación de Toolcraft (`requestAnimationFrame` o hook del runtime).
>
> **Criterio de Aceptación:**
> `npm run typecheck` pasa en verde. El lienzo muestra el reloj avanzando y reiniciándose limpiamente de 0 a 1. La función de evaluación genera datos numéricos coherentes sin errores en consola.

---

### Fase 1: Motor de Renderizado y Arquetipo Visual Base

**Objetivo:** Renderizar la geometría básica del efecto visual en el lienzo (Canvas 2D o Three.js) con movimiento continuo en bucle y controles de transporte mínimos.

**Prompt:**
> [Shared Context Header]
>
> Construye sobre los contratos de la Fase 0.
>
> 1. **Pipeline de Renderizado (`src/app/[proyecto]-renderer.tsx`):**
>    - Conecta la geometría calculada por `evaluate(...)` con la API de renderizado ([Canvas 2D / Three.js / WebGL]).
>    - Dibuja el elemento visual principal (ej. el conjunto de líneas curvadas, la malla deformada o la nube de partículas) utilizando los colores y grosores por defecto del esquema.
>    - Garantiza 60 FPS estables con escalado adecuado para pantallas Retina (`window.devicePixelRatio`).
>
> 2. **Controles de Transporte y Viewport:**
>    - Botón de reproducir / pausar (Play / Pause).
>    - Control deslizante de scrubbing temporal para inspeccionar cualquier valor de `t` (0% a 100%).
>    - Indicador de tiempo transcurrido o fotograma actual.
>    - Ajuste al lienzo (Fit to screen) o zoom básico.
>
> **Criterio de Aceptación:**
> Al pulsar Play, la animación fluye en un loop infinito sin tirones ni saltos en el corte. Al arrastrar el control de tiempo (scrubbing), la geometría se actualiza exactamente en el punto indicado.

---

### Fase 2: Controles Paramétricos y Reactividad en Tiempo Real

**Objetivo:** Conectar el panel lateral de Toolcraft con todos los parámetros del esquema para que el usuario pueda moldear la escena interactivamente.

**Prompt:**
> [Shared Context Header]
>
> El motor y el renderizado base ya funcionan. Ahora implementa los **controles interactivos**:
>
> 1. **Panel de Controles Paramétricos:**
>    - Sliders numéricos para cada parámetro de geometría (amplitud, espaciado, número de elementos, curvatura) con rangos y pasos adecuados.
>    - Selectores de color nativos o popups para fondo, líneas/figuras y luces.
>    - Selectores de modo (ej. estilos de renderizado, modos de proyección o esquemas cromáticos).
>    - Toggles para activar/desactivar características secundarias.
>
> 2. **Reactividad Inmediata:**
>    - Cada cambio en un slider debe reflejarse instantáneamente en el lienzo sin latencia perceptible.
>    - Añade botones de "Restablecer a valores iniciales" (Reset) por sección.
>
> **Criterio de Aceptación:**
> Mover cualquier control deslizante altera la forma o color en tiempo real. Los límites mínimos y máximos evitan estados rotos (ej. 0 divisiones o NaN). El botón Reset devuelve los valores por defecto.

---

### Fase 3: Profundidad Visual, Atmósfera y Acabado Artístico

**Objetivo:** Elevar el resultado visual de un wireframe básico a un producto de alta calidad estética (luces de fondo, volumen, relieve, grano/ruido analógico).

**Prompt:**
> [Shared Context Header]
>
> La reactividad y la geometría están completas. Añade las capas de **estilo, profundidad y atmósfera**:
>
> 1. **Iluminación y Fondos Dinámicos:**
>    - Implementa una atmósfera de fondo dinámica (luces difusas, halos o degradados radiales) que respondan a la paleta elegida y sigan el centro o cresta del movimiento.
>
> 2. **Relieve y Facetas / Shading:**
>    - Añade modulación de relieve (sombreado lateral, gradientes de borde o simulación de extrusión/volumen).
>
> 3. **Textura y Post-procesado:**
>    - Añade una capa de grano sutil (Grain / Noise) configurable en intensidad y escala mediante un shader o filtro SVG/Canvas.
>    - El grano no debe blanquear el lienzo ni degradar la saturación de los colores base.
>
> **Criterio de Aceptación:**
> La escena adquiere volumen, profundidad e iluminación atmosférica. El cambio de paleta tiñe armónicamente tanto la figura principal como los halos de fondo.

---

### Fase 4: Bucle Perfecto y Motor de Exportación (Video e Imagen)

**Objetivo:** Permitir al usuario descargar el resultado como imagen estática (PNG/SVG) o bucle de video fluido (MP4/WebM) sin pérdida de fotogramas ni saltos visibles.

**Prompt:**
> [Shared Context Header]
>
> Implementa el sistema de **exportación determinista**:
>
> 1. **Exportación de Imagen Fija:**
>    - Descarga en formato PNG a resolución nativa o multiplicada (1x, 2x, 4x) del fotograma actual.
>    - Si el renderizador es vectorial, habilita la opción de descarga en SVG limpio y escalable.
>
> 2. **Exportación de Video en Bucle (Seamless Loop):**
>    - Graba de forma offline fotograma a fotograma (renderizando `t = 0`, `t = 1/N`, ..., `t = (N-1)/N`) a la tasa de fotogramas configurada (30 o 60 fps).
>    - Genera el archivo final en MP4 (H.264) o WebM mediante MediaBunny / MediaRecorder / canvas capture.
>    - **Regla estricta de loop:** El fotograma 1.0 NUNCA se graba como último frame; el último frame grabado es $1 - 1/N$ para que al reproducirse en bucle encaje perfectamente con el frame 0.
>
> **Criterio de Aceptación:**
> El video exportado se reproduce en bucle en un reproductor multimedia estándar sin saltos perceptibles ni congelaciones en el corte. La imagen PNG conserva nitidez y transparencia si corresponde.

---

### Fase 5: Biblioteca de Presets, Pruebas Automatizadas y Pulido

**Objetivo:** Consolidar el producto con presets curados, pruebas de regresión Playwright y verificación de rendimiento.

**Prompt:**
> [Shared Context Header]
>
> Fase final de consolidación y calidad:
>
> 1. **Biblioteca de Presets Curados (`src/app/app-acceptance-data.ts`):**
>    - Diseña de 4 a 6 presets con identidades visuales contrastadas (ej. "Cyber Neon", "Minimal Monochrome", "Deep Ocean", "Warm Sunset").
>    - Cada preset carga al instante una configuración completa coherente.
>
> 2. **Pruebas de Aceptación y Regresión (Playwright):**
>    - Añade tests e2e en `e2e/app-controls.spec.ts` que verifiquen:
>      - Carga de la aplicación y renderizado del canvas.
>      - Respuesta de los controles principales.
>      - Cambio y aplicación correcta de cada preset.
>      - Verificación de la exportación y reproducción del loop.
>
> 3. **Verificación Global:**
>    - Ejecuta `npm run typecheck`, las pruebas unitarias y de integridad.
>
> **Criterio de Aceptación:**
> La suite de tests Playwright corre en verde. Cambiar entre presets transforma la escena de manera inmediata. Cero errores de TypeScript.
```
