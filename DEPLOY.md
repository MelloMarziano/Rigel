# Pasos para Desplegar en GitHub Pages

Este documento describe cómo desplegar la aplicación en GitHub Pages.

## Prerrequisitos

- Asegúrate de tener Node.js y Angular CLI instalados.
- Asegúrate de que todos los cambios que quieres desplegar estén confirmados (`committed`) en la rama principal (`locked`).

## Proceso de Despliegue

El proyecto está configurado para usar `angular-cli-ghpages`, lo que simplifica el proceso.

1.  **Abre una terminal** en la raíz del proyecto.

2.  **Ejecuta el comando de despliegue**:
    ```bash
    npm run deploy
    ```

Este comando hará lo siguiente:
- Construirá la aplicación en modo de producción.
- Usará la configuración de `angular.json` para establecer el `baseHref` a `/rigel/`.
- Publicará el contenido de la carpeta `dist/rigel` en la rama `gh-pages` de tu repositorio en GitHub.

Después de unos minutos, los cambios estarán visibles en la URL de tu GitHub Pages: [https://MelloMarziano.github.io/Rigel/](https://MelloMarziano.github.io/Rigel/)
