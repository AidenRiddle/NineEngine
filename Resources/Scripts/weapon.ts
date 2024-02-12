import { Component } from "./Core/NineEngine";

export class Weapon extends Component {
    damage: f32 = 0;
    armorPen: f32 = 0;

    Start(): void {
        console.log("Gaining Armor Pen: " + this.armorPen.toString());
        this.gainArmorPen();
        console.log("New Armor Pen: " + this.armorPen.toString());
    }
    Update(): void { }

    gainArmorPen(): void { this.armorPen += 15; }
    getArmorPen(): f32 { return this.armorPen; }
    getDamage(): f32 { return this.damage; }
}