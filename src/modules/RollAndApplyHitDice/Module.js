import { R20Module } from "../../tools/R20Module";
import { R20 } from "../../tools/R20";
import { DOM } from "../../tools/DOM";
import { findByIdAndRemove } from "../../tools/MiscUtils";
import { TokenContextMenu } from "../../tools/TokenContextMenu";

class RollAndApplyHitDiceModule extends R20Module.SimpleBase {
    constructor() {
        super(__dirname);

        this.onClickMenuItem = this.onClickMenuItem.bind(this);
    }

    fancySay(msg, callback) {
        R20.sayToSelf(`&{template:default} {{name=R20ES Hit Dice}} {{${msg}}}`, callback);
    }

    onClickMenuItem(e) {
        const objects = R20.getSelectedTokens();
        const config = this.getHook().config;

        // tokens will locally disappear if we do not unselect them here
        R20.unselectTokens();

        let numRolled = 0;

        for (let token of objects) {

            if (!token.model || !token.model.character) continue;

            let attribs = token.model.character.attribs;

            // find hpForumla
            let hpFormula = null;
            for (let attrib of attribs.models) {
                if (!hpFormula && attrib.attributes.name === config.diceFormulaAttribute) {
                    hpFormula = attrib.attributes.current;
                    break;
                }
            }

            if (!hpFormula) {
                this.fancySay(`Could not find attribute ${config.diceFormulaAttribute}`);

                continue;
            }

            this.fancySay(`${token.model.character.get("name")}: [[${hpFormula}]]`, (_, o) => {
                if (!o.inlinerolls || o.inlinerolls.length <= 0) return;

                let hp = o.inlinerolls[0].results.total;

                let barValue = config.bar + "_value";
                let barMax = config.bar + "_max";
                let save = {};
                save[barValue] = hp;
                save[barMax] = hp;
                token.model.save(save);

                // reselect when we're done processing all callbacks.
                numRolled++;
                if (numRolled >= objects.length) {
                    for (let sel of objects) {
                        R20.addTokenToSelection(sel);
                    }
                }
            });
        }
    }

    setup() {
        if(!R20.isGM()) return;

        TokenContextMenu.addButton("Hit Dice", this.onClickMenuItem, {
            mustHaveSelection: true
        });
    }

    dispose() {
        TokenContextMenu.removeButton("Hit Dice", this.onClickMenuItem);
    }
}

if (R20Module.canInstall()) new RollAndApplyHitDiceModule().install();
