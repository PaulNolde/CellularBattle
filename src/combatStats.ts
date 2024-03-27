
export enum UnitType{
    soldier,
    archer,
    cavalry
}

export enum UnitUpgrade{
    amount,
    damage,
    hp
}

export enum FightPhase{
    Cavalry,
    Archers,
    Soldiers,
    None,
    AfterRound
}


export default class CombatStats{
    resBase:number[]

    soldierAmount:number;
    soldierDamage:number;
    soldierHp:number;

    archerAmount:number;
    archerDamage:number;
    archerHp:number;

    cavalryAmount:number;
    cavalryDamage:number;
    cavalryHp:number;

    constructor(){
        this.resBase = [0,0,0]
        
        this.soldierAmount = 10;
        this.soldierDamage = 2;
        this.soldierHp = 10;

        this.archerAmount = 0;
        this.archerDamage = 4;
        this.archerHp = 10;

        this.cavalryAmount = 0;
        this.cavalryDamage = 10;
        this.cavalryHp = 20;
    }

    copyStats(stats:CombatStats){
        
        this.soldierAmount = stats.soldierAmount;
        this.soldierDamage = stats.soldierDamage;
        this.soldierHp = stats.soldierHp;

        this.archerAmount = stats.archerAmount;
        this.archerDamage = stats.archerDamage;
        this.archerHp = stats.archerHp;

        this.cavalryAmount = stats.cavalryAmount;
        this.cavalryDamage = stats.cavalryDamage;
        this.cavalryHp = stats.cavalryHp;
    }
}
