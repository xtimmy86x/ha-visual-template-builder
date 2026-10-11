# Changelog

## Unreleased

- Reorganized the editor into numbered steps: name and type, rule, advanced options.
- Result type is chosen from cards with an example each; new sensors offer one-click rule examples.
- Searchable entity picker with friendly names, live values and readable chips; attributes are chosen from the entity's real attributes.
- Advanced options can copy unit and classes from the source entity; state classes have readable labels.
- The save bar stays visible and shows the live result on mobile.

## 0.3.0

- Redesigned the general expression editor for calculations, comparisons, conditions, counts and text composition.
- Replaced nested generic node boxes with compact contextual value controls, inline comparisons and Se / Mostra / Altrimenti sections.
- Added a live natural-language rule summary using entity names.
- Group related conditions with explicit all/any choices; retain compatible operands when changing operations.
- Hide optional attribute inputs until needed and keep existing attribute-based rules editable.
- Renamed the general text view to Regole e calcoli (Rules and calculations); the state-to-text shortcut remains available.
- Preserve existing expression trees and saved sensor behavior when opening the new editor.

## 0.2.0

- Added a guided **State → text** editor: select one entity, then edit a flat state/text table.
- Suggest cover states (closed/open/opening/closing), on/off states and entity options automatically.
- Show current source state and highlight its matching row with live preview.
- Reopen compatible existing 0.1.0 rules directly in the simple editor without rewriting their values or fallback.
- Keep complex rules in the advanced editor; switch compatible rules between views without losing information.
- Reject duplicate/empty state rows before saving.

## 0.1.0

Initial experimental version: visual numeric, text and binary sensors; nested calculations, comparisons, conditions, text composition and counts; local live preview; edit/duplicate/delete and configuration export; event-driven updates and persisted definitions; explicit unavailable/fallback/keep-last behavior; Italian/English responsive sidebar panel; HACS custom-repository installation.
