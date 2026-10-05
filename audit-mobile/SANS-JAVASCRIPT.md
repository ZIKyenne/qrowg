# Ce que le HTML affiche avant le JavaScript — 390 px

Mesuré le 2026-10-05

| Vue | Sans JS | Texte visible | Débordement | Coupables |
| --- | --- | --- | --- | --- |
| `/` | **page servie** | 6658 car. | — | — |
| `/creer` | **page servie** | 1297 car. | — | — |
| `/qr-code/restaurant` | **page servie** | 2166 car. | — | — |
| `/e2e-harness/accueil` | **page servie** | 591 car. | — | — |
| `/e2e-harness/statistiques` | coquille d'attente | 45 car. | — | — |
| `/e2e-harness/templates` | **page servie** | 1512 car. | — | — |
| `/e2e-harness/qr-studio` | **page servie** | 919 car. | — | — |

## Comment lire ce tableau

**« coquille d'attente »** veut dire que l'écran est rendu entièrement côté
client : sans JavaScript, le téléphone n'affiche qu'un message d'attente. Son
« zéro débordement » ne prouve donc rien sur la mise en page — il n'y en a pas.
Ce que ça dit, en revanche, est utile : sur un réseau lent, voilà ce qu'on
regarde en attendant. Un squelette y renseignerait la forme de l'écran ; un
rouet ne renseigne rien.

Désactiver JavaScript n'est pas simuler un réseau lent : c'est le cas limite,
ce que le HTML dit tout seul. La durée réelle de l'écart, sur un vrai réseau,
appartient à un vrai téléphone.
