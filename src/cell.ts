
export enum CellType{
    food,
    wood,
    metal,
    none
}

export default class Cell{

    currType:CellType;
    nextType:CellType;

    currTier:number;
    nextTier:number;
    neighborMoore: Cell[];
    neighborNeumann: Cell[];
    changed:boolean;

    constructor(type:CellType, tier:number){
        

        this.neighborMoore = [];
        this.neighborNeumann = [];
        this.currType = type;
        this.currTier = tier;

        this.nextType = CellType.none
        this.nextTier = 0;
        this.changed = true;
    }
    isCellEmpty():boolean{
        return this.currType == CellType.none;
    }

    clearCell(){
        this.clearCurrCell();
        this.clearNextCell();
    }

    clearCurrCell(){
        this.currType = CellType.none;
        this.currTier = 0;
        this.changed = true;
    }

    clearNextCell(){
        this.nextType = CellType.none;
        this.nextTier = 0;
        this.changed = true;
    }

    setCurrCell(type:CellType, tier:number){
        this.currType = type;
        this.currTier = tier;
        this.changed = true;
    }

    setNextCell(type:CellType, tier:number){
        this.nextType = type;
        this.nextTier = tier;
        this.changed = true;
    }
}