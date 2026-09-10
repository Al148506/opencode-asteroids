---
description: Crea un worktree local a partir del contexto recibido.
agent: build
---

Analiza el contexto recibido en `$ARGUMENTS`, aunque contenga espacios, y conviertelo en un nombre breve y descriptivo usando solo minusculas, numeros y guiones (`kebab-case`).
Si los argumentos son muy largos, simplificalos a un nombre significativo
Ejecuta unicamente este comando, reemplazando `<nombre-del-worktree>` por el nombre generado:

```bash
git worktree add .worktrees/<nombre-del-worktree>
```

No cambies de directorio, no ejecutes ningun otro comando, no crees directorios manualmente, no modifiques archivos y no realices ninguna accion adicional.
