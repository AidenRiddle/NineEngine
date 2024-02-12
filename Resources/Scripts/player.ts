import { Component, Time } from "./Core/NineEngine";
import { Weapon } from "./weapon";

export class Player extends Component {
    angleToRad: f32 = 3.14159 / 180;
    health: f32 = 0;
    level: i8 = 0;
    armorPerLevel: i32 = 0;
    armor: i32 = 0;
    energy: f32 = 0;

    weapon: Weapon | null = null;

    Start(): void {
        console.log("Starting Player...");
        (<Weapon> this.weapon).Start();
        
        console.log("Hurting Myself...");
        this.receiveDamage((<Weapon> this.weapon).damage + (<Weapon> this.weapon).armorPen);
        this.getHealth();
    }

    Update(): void {
    }

    getHealth(): f32 { console.log("Health: " + this.health.toString()); return this.health; }
    getLevel(): f32 { return this.level; }
    getArmor(): f32 { return this.armor; }

    receiveDamage(value: f32): void {
        this.health -= value;
    }

    recieveHeal(value: f32): void {
        this.health += value;
    }

    levelUp(): void {
        this.level++;
        this.armor += this.armorPerLevel;
    }

    readStartWeapon(): Weapon { return (<Weapon> this.weapon); }
    bindStartWeapon(w: Weapon): Weapon { this.weapon = w; return w; }
}