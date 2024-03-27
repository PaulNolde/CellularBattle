import * as Phaser from 'phaser';
import Cell from './cell';
import {CellType} from './cell';
import { GameState } from './gameState';
import CombatStats from './combatStats'
import { UnitType } from './combatStats';
import { UnitUpgrade } from './combatStats';
import { FightPhase } from './combatStats';

export default class Demo extends Phaser.Scene
{   
    timer:number = 0;
    playing: boolean = false;
    fighting: boolean = false;
    stepLimit = 5;
    stepCounter = 0;
    simulationSpeed:number = 0.1; //in seconds
    fightingSpeed:number = 1.5;
    gridSize:number = 32;
    gridHeight:number = 21;
    gridWidth:number = 21;

    placingType:CellType = CellType.food;

    currentPlayer:number = 0;
    roundStartingPlayer:number = 0;
    currentPlayerIndicator: Phaser.GameObjects.Text;

    phase:GameState = GameState.Buying;
    phaseText:Phaser.GameObjects.Text;

    pool:any;
    poolSize:number = 0;
    poolText: Array<Phaser.GameObjects.Text> = new Array<Phaser.GameObjects.Text>(10)
    poolRect: Array<Phaser.GameObjects.Rectangle> = new Array<Phaser.GameObjects.Rectangle>(10)

    shopButtons:Phaser.GameObjects.Rectangle[] = [];
    readyButton:Phaser.GameObjects.Rectangle;

    fightRoundRect:Phaser.GameObjects.Rectangle;
    fightRoundText:Phaser.GameObjects.Text;
    fightSplitRect:Phaser.GameObjects.Rectangle;
    fightSplitText:Phaser.GameObjects.Text;
    fightRound: number = 0;
    fightPhase: FightPhase = FightPhase.None;

    lastRoundWon:number = -1 //0 = player1, 1 = player2, 2 = both

    //player 1
    grid:Cell[][];
    rectangles:Phaser.GameObjects.Rectangle[][];
    stats1:CombatStats;
    tempStats1: CombatStats;
    resources:number[];
    resourcesChange:number[];
    foodText1:Phaser.GameObjects.Text;
    woodText1:Phaser.GameObjects.Text;
    metalText1:Phaser.GameObjects.Text;

    cells1:[number, number, number] = [0,0,0]
    cellsText1:Phaser.GameObjects.Text;
    points:number = 0;
    pointsText:Phaser.GameObjects.Text;

    fightRect1:Phaser.GameObjects.Rectangle[] = [];
    fightText1:Phaser.GameObjects.Text[] = [];

    

    //player 2
    grid2:Cell[][];
    rectangles2:Phaser.GameObjects.Rectangle[][];
    stats2:CombatStats;
    tempStats2: CombatStats;
    resources2:number[];
    resourcesChange2:number[];
    foodText2:Phaser.GameObjects.Text;
    woodText2:Phaser.GameObjects.Text;
    metalText2:Phaser.GameObjects.Text;

    cells2:[number, number, number]= [0,0,0]
    cellsText2:Phaser.GameObjects.Text;
    points2:number = 0;
    points2Text:Phaser.GameObjects.Text;

    fightRect2:Phaser.GameObjects.Rectangle[] = [];
    fightText2:Phaser.GameObjects.Text[] = [];





    constructor ()
    {
        super('demo');
    }

    preload ()
    {

    }

    create ()
    {
        
        this.grid = this.setupGrid();
        this.grid2 = this.setupGrid();
        

        [this.resources, this.resourcesChange] = this.setupResources();
        [this.resources2, this.resourcesChange2] = this.setupResources();
        

        this.setNeighbors(this.grid);
        this.setNeighbors(this.grid2);

        var gridOffset = 1200;

        this.rectangles = this.setupRectangles(0, 64);
        this.rectangles2 = this.setupRectangles(gridOffset, 64);

        this.stats1 = new CombatStats();
        this.stats2 = new CombatStats();
        this.tempStats1 = new CombatStats();
        this.tempStats2 = new CombatStats();
        
        //UI
        //topBar
        var topBar = new Phaser.GameObjects.Rectangle(this, 0, 0, 1900, 64, 0x888888, 1).setStrokeStyle(2, 0x000000, 1.0).setOrigin(0,0);
        this.add.existing(topBar)
        this.pointsText = this.add.text(0 , 0, '0').setFill('#0000FF').setFontSize(64).setStroke("#000000", 6);
        this.points2Text = this.add.text(1850, 0, '0').setFill('#FF0000').setFontSize(64).setStroke("#000000", 6);
        this.phaseText = this.add.text(600, 0, 'test').setFill('#000000').setFontSize(64);
        this.setPhaseText();
        this.setPointsText();

        //pick
        var pickRect = new Phaser.GameObjects.Rectangle(this, 710, 80, 480, 128, 0x888888, 1).setStrokeStyle(2, 0x000000, 1.0).setOrigin(0, 0);
        this.add.existing(pickRect)
        
        //shop
        var shopRect = new Phaser.GameObjects.Rectangle(this, 710, 228, 480, 272, 0x888888, 1).setStrokeStyle(2, 0x000000, 1.0).setOrigin(0, 0);
        this.add.existing(shopRect)

        this.setupShop();
        //ready button
        this.readyButton = new Phaser.GameObjects.Rectangle(this, 710, 516, 480, 64, 0x333333, 1).setStrokeStyle(2, 0x000000, 1.0).setOrigin(0, 0);
        this.add.existing(this.readyButton)
        var text  = this.add.text(0, 0, "Ready").setStroke("#000000", 4).setAlign('center');
        Phaser.Display.Align.In.Center(text, this.readyButton);
        this.readyButton.on('pointerdown', () => this.readyButtonFunc());


        //fight
        var fightRect = new Phaser.GameObjects.Rectangle(this, 710, 596, 480, 320, 0x888888, 1).setStrokeStyle(2, 0x000000, 1.0).setOrigin(0, 0);
        this.add.existing(fightRect)
        this.setupFight()

        var textOffset = 64
        //Buttons
        // const stepButton = this.add.text((this.gridWidth+2) * this.gridSize , textOffset*0.5, 'Step').setFill('#FF0000').setFontSize(40).setStroke("#000000", 6);
        // stepButton.setInteractive();
        // stepButton.on('pointerdown', () => this.stepButtonFunc() );

        // const playButton = this.add.text((this.gridWidth+2) * this.gridSize + 150, textOffset*0.5, 'Play').setFill('#FF0000').setFontSize(40).setStroke("#000000", 6);
        // playButton.setInteractive();
        // playButton.on('pointerdown', () => this.playButtonFunc());

        // const stopButton = this.add.text((this.gridWidth+2) * this.gridSize + 300, textOffset*0.5, 'Stop').setFill('#FF0000').setFontSize(40).setStroke("#000000", 6);
        // stopButton.setInteractive();
        // stopButton.on('pointerdown', () => this.stopButtonFunc());

        // const resetButton = this.add.text((this.gridWidth+2) * this.gridSize , textOffset*1.5, 'Reset').setFill('#FF0000').setFontSize(40).setStroke("#000000", 6);
        // resetButton.setInteractive();
        // resetButton.on('pointerdown', () => this.resetButtonFunc());

        // const clearButton = this.add.text((this.gridWidth+2) * this.gridSize + 150, textOffset*1.5, 'Clear').setFill('#FF0000').setFontSize(40).setStroke("#000000", 6);
        // clearButton.setInteractive();
        // clearButton.on('pointerdown', () =>  this.clearButtonFunc());

        // const countButton = this.add.text((this.gridWidth+2) * this.gridSize + 300, textOffset*1.5, 'Count').setFill('#FF0000').setFontSize(40).setStroke("#000000", 6);
        // countButton.setInteractive();
        // countButton.on('pointerdown', () => this.countButtonFunc());

        // var changeButton = this.add.text((this.gridWidth+2) * this.gridSize + 150, textOffset*2.5, 'Change').setFill('#FF0000').setFontSize(40).setStroke("#000000", 6);
        // changeButton.setInteractive();
        // changeButton.on('pointerdown', () =>  this.changeButtonFunc());
        // this.currentPlayerIndicator = this.add.text((this.gridWidth+2) * this.gridSize + 175, textOffset*3.5, '<--').setFill('#FF0000').setFontSize(40).setStroke("#000000", 6);

        //resource texts
        this.foodText1 = this.add.text(textOffset, textOffset*12, 'Count').setFill('#556b2f').setFontSize(24).setStroke("#000000", 4).setText("Food:\n0\n+0\n1/2/3").setAlign('right')
        this.woodText1 = this.add.text(textOffset * 3, textOffset*12, 'Count').setFill('#D0B49F').setFontSize(24).setStroke("#000000", 4).setText("Wood:\n0\n+0\n1/2/3").setAlign('right')
        this.metalText1 = this.add.text(textOffset * 5, textOffset*12, 'Count').setFill('#86CEFA').setFontSize(24).setStroke("#000000", 4).setText("Metal\n0\n+0\n1/2/3").setAlign('right')
        var foodRect1 = this.add.existing(new Phaser.GameObjects.Rectangle(this,textOffset * 7 , textOffset*12, 24, 24, 0x556b2f, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        var woodRect1 = this.add.existing(new Phaser.GameObjects.Rectangle(this,textOffset * 7 , textOffset*12.5, 24, 24, 0xD0B49F, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        var metalRect1 = this.add.existing(new Phaser.GameObjects.Rectangle(this,textOffset * 7 , textOffset*13, 24, 24, 0x86CEFA, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        this.cellsText1 = this.add.text(textOffset * 7.5, textOffset*12, 'Count').setFill('#000000').setFontSize(28).setStroke("#000000", 4).setText("0\n0\n0").setAlign('right')

        this.foodText2 = this.add.text(textOffset + gridOffset, textOffset*12, 'Count').setFill('#556b2f').setFontSize(24).setStroke("#000000", 4).setText("Food:\n0\n+0\n1/2/3").setAlign('right')
        this.woodText2 = this.add.text(textOffset * 3 + gridOffset, textOffset*12, 'Count').setFill('#D0B49F').setFontSize(24).setStroke("#000000", 4).setText("Wood:\n0\n+0\n1/2/3").setAlign('right')
        this.metalText2 = this.add.text(textOffset * 5 + gridOffset, textOffset*12, 'Count').setFill('#86CEFA').setFontSize(24).setStroke("#000000", 4).setText("Metal\n0\n+0\n1/2/3").setAlign('right')
        var foodRect2 = this.add.existing(new Phaser.GameObjects.Rectangle(this,textOffset * 7 + gridOffset, textOffset*12, 24, 24, 0x556b2f, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        var woodRect2 = this.add.existing(new Phaser.GameObjects.Rectangle(this,textOffset * 7 + gridOffset, textOffset*12.5, 24, 24, 0xD0B49F, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        var metalRect2 = this.add.existing(new Phaser.GameObjects.Rectangle(this,textOffset * 7 + gridOffset, textOffset*13, 24, 24, 0x86CEFA, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        this.cellsText2 = this.add.text(textOffset * 7.5 + gridOffset, textOffset*12, 'Count').setFill('#000000').setFontSize(28).setStroke("#000000", 4).setText("0\n0\n0").setAlign('right')
        this.setCellsText();

        this.setResourceText(this.stats1, this.foodText1, this.woodText1, this.metalText1, this.resources, this.resourcesChange);
        this.setResourceText(this.stats2, this.foodText2, this.woodText2, this.metalText2, this.resources2, this.resourcesChange2);

        //Keyboard inputs
        this.input.keyboard.on('keydown-ONE', () => {this.placingType = CellType.food}, this);
        this.input.keyboard.on('keydown-TWO', () => {this.placingType = CellType.wood}, this);
        this.input.keyboard.on('keydown-THREE', () => {this.placingType = CellType.metal}, this);

        // this.setStartConfig(this.grid);
        // this.setStartConfig(this.grid2);

        this.setCellInput(0, this.grid, this.rectangles);
        this.setCellInput(1, this.grid2, this.rectangles2);

        

        this.updateRectangles(this.grid, this.rectangles);
        this.updateRectangles(this.grid2, this.rectangles2);

        this.changeToPhase(GameState.Picking);

    }

    update(time: number, delta: number): void {
        if(this.playing){
            this.timer += delta;
            if(this.timer > this.simulationSpeed * 1000){
                
                this.timer -= this.simulationSpeed * 1000;
                
                if(this.stepCounter >= this.stepLimit){
                    this.calculateResources(this.stats1, this.grid, this.resources, this.resourcesChange);
                    this.calculateResources(this.stats2, this.grid2, this.resources2, this.resourcesChange2);
                    this.setResourceText(this.stats1, this.foodText1, this.woodText1, this.metalText1, this.resources, this.resourcesChange);
                    this.setResourceText(this.stats2, this.foodText2, this.woodText2, this.metalText2, this.resources2, this.resourcesChange2);
                    this.playing = false;
                    this.changeToBuyingPhase();
                }
                else{
                    this.fullStep(this.grid, this.rectangles)
                    this.fullStep(this.grid2, this.rectangles2)
                }
                this.stepCounter += 1;
            }
        }
        if(this.fighting){
            this.timer += delta;
            if(this.timer > this.fightingSpeed * 1000){
                this.timer -= this.fightingSpeed * 1000;

                var won = this.calculateFight(this.tempStats1, this.tempStats2)
                

                if(won){
                    this.fighting = false;
                    this.fightPhase = FightPhase.AfterRound;
                    this.setRoundText;
                    this.changeToPickingPhase();
                }
            }
        }
    }

    setupGrid(): Cell[][]{
        var temp = new Array(this.gridHeight);
        for(var i = 0; i < this.gridWidth; i++ ){
            temp[i] = new Array(this.gridWidth)
        }

        for(var i = 0; i < this.gridHeight; i++ ){
            for(var j = 0; j < this.gridWidth; j++ ){
                temp[i][j] = new Cell(CellType.none ,0)
            }
        }
        return temp;
    }

    setupResources():[number[], number[]]{
        var res = new Array(3).fill(0);
        var resC = new Array(3).fill(0);

        res[0] = 20;
        res[1] = 20;
        res[2] = 20;
        return [res, resC]
    }

    setupRectangles(xOffset:number, yOffset:number):Phaser.GameObjects.Rectangle[][]{

        var temp = new Array(this.gridHeight);
        for(var i = 0; i < this.gridHeight; i++ ){
            temp[i] = new Array(this.gridWidth)
        }

        for(var i = 0; i < this.gridHeight; i++ ){
            for(var j = 0; j < this.gridWidth; j++ ){
                temp[i][j] = new Phaser.GameObjects.Rectangle(this, (j+1) * this.gridSize + xOffset, (i+1) * this.gridSize + yOffset, this.gridSize, this.gridSize, 0x444444, 1);
                this.add.existing(temp[i][j]);
                temp[i][j].setStrokeStyle(2, 0x000000, 1.0);
                temp[i][j].setData({x: i, y: j});
            }
        }
        return temp;
    }

    stepButtonFunc(){
        this.fullStep(this.grid, this.rectangles)
        this.fullStep(this.grid2, this.rectangles2)
    }
    
    playButtonFunc(){
        this.playing = true;
        this.timer = 0;
        this.stepCounter = 0;
    }

    stopButtonFunc(){
        this.playing = false;
    }

    resetButtonFunc(){
        this.clearCells(this.grid);
        this.clearNextCells(this.grid);
        this.setStartConfig(this.grid);
        this.updateRectangles(this.grid, this.rectangles);

        this.clearCells(this.grid2);
        this.clearNextCells(this.grid2);
        this.setStartConfig(this.grid2);
        this.updateRectangles(this.grid2, this.rectangles2);
    }

    clearButtonFunc(){
        this.clearCells(this.grid);
        this.clearNextCells(this.grid); 
        this.updateRectangles(this.grid, this.rectangles); 
        this.clearResources(this.resources, this.resourcesChange);
        this.setResourceText(this.stats1, this.foodText1, this.woodText1, this.metalText1, this.resources, this.resourcesChange);

        this.clearCells(this.grid2);
        this.clearNextCells(this.grid2); 
        this.updateRectangles(this.grid2, this.rectangles2); 
        this.clearResources(this.resources2, this.resourcesChange2);
        this.setResourceText(this.stats2, this.foodText2, this.woodText2, this.metalText2, this.resources2, this.resourcesChange2);
    }

    countButtonFunc(){
        this.calculateResources(this.stats1, this.grid,  this.resources, this.resourcesChange); 
        this.calculateResources(this.stats2, this.grid2,  this.resources2, this.resourcesChange2); 
        this.setResourceText(this.stats1, this.foodText1, this.woodText1, this.metalText1, this.resources, this.resourcesChange);
        this.setResourceText(this.stats2, this.foodText2, this.woodText2, this.metalText2, this.resources2, this.resourcesChange2);
    }

    changeButtonFunc(){
        if(this.currentPlayer == 2){
            this.setPlayer(0);
        }
        else{
            this.setPlayer(this.currentPlayer + 1);
        }
        
    }

    updateRectangles(grid: Cell[][], rectangles:Phaser.GameObjects.Rectangle[][]){
        var drawn = 0;
        //this.graphics.lineStyle(1, 0x000000, 1.0)
        for(var i = 0; i < this.gridHeight; i++ ){
            for(var j = 0; j < this.gridWidth; j++ ){
                if(grid[i][j].changed == true){
                    drawn += 1;
                    
                    if(grid[i][j].currType == CellType.food) {
                        if(grid[i][j].currTier == 0){
                            rectangles[i][j].setFillStyle(0x556b2f, 1)
                        }
                        else if(grid[i][j].currTier == 1){
                            rectangles[i][j].setFillStyle(0x2b3618, 1)
                        }
                        else {
                            rectangles[i][j].setFillStyle(0x111509, 1)
                        }
                    } 
                    else if(grid[i][j].currType == CellType.wood) {
                        if(grid[i][j].currTier == 0){
                            rectangles[i][j].setFillStyle(0xD0B49F, 1)
                        }
                        else if(grid[i][j].currTier == 1){
                            rectangles[i][j].setFillStyle(0xA47551, 1)
                        }
                        else {
                            rectangles[i][j].setFillStyle(0x523A28, 1)
                        }
                    }
                    else if(grid[i][j].currType == CellType.metal) {
                        if(grid[i][j].currTier == 0){
                            rectangles[i][j].setFillStyle(0x86CEFA, 1)
                        }
                        else if(grid[i][j].currTier == 1){
                            rectangles[i][j].setFillStyle(0x3373C4, 1)
                        }
                        else {
                            rectangles[i][j].setFillStyle(0x003396, 1)
                        }
                    }
                    else{
                        rectangles[i][j].setFillStyle(0x444444, 1.0)
                    }

                    grid[i][j].changed = false;
                }
            }
        }
        //console.log("drawn: " + drawn)
    }

    setStartConfig(grid: Cell[][]){

        grid[4][3].currType = CellType.food;
        grid[4][4].currType = CellType.food;
        grid[4][5].currType = CellType.food;


        grid[11][3].currType = CellType.wood;
        grid[13][3].currType = CellType.wood;
        grid[13][5].currType = CellType.wood;
        grid[15][5].currType = CellType.wood;

        grid[7][11].currType = CellType.metal;
        grid[7][13].currType = CellType.metal;
        grid[7][15].currType = CellType.metal;
        grid[9][13].currType = CellType.metal;
        

        this.changeAllCells(grid);
    }


    setCellsActive(rectangles:Phaser.GameObjects.Rectangle[][]){
        for(var i = 0; i < this.gridHeight; i++ ){
            for(var j = 0; j < this.gridWidth; j++ ){
                rectangles[i][j].setInteractive()
            }
        }
    }

    setCellsInactive(rectangles:Phaser.GameObjects.Rectangle[][]){
        for(var i = 0; i < this.gridHeight; i++ ){
            for(var j = 0; j < this.gridWidth; j++ ){
                rectangles[i][j].disableInteractive()
            }
        }
    }

    setCellInput(player:number, grid: Cell[][], rectangles:Phaser.GameObjects.Rectangle[][]){
        for(var i = 0; i < this.gridHeight; i++ ){
            for(var j = 0; j < this.gridWidth; j++ ){
                let x = i;
                let y = j;
                //rectangles[i][j].on('pointerdown', () => this.setCellType(grid, rectangles,  x, y))
                rectangles[i][j].on('pointerdown', () => this.placeCell(player, grid, rectangles,  x, y))

            }
        }
    }

    setCellType(player:number, grid: Cell[][], rectangles:Phaser.GameObjects.Rectangle[][], x:number, y:number){
        if(grid[x][y].currType != this.placingType){

            if(grid[x][y].currType.valueOf() < 3){
                if(player == 0) this.cells1[grid[x][y].currType.valueOf()] += 1;
                else this.cells2[grid[x][y].currType.valueOf()] += 1;
            }

            grid[x][y].currType = this.placingType;
            grid[x][y].currTier = 0;
            grid[x][y].changed = true;
            if(player == 0) this.cells1[this.placingType.valueOf()] -= 1;
            else this.cells2[this.placingType.valueOf()] -= 1;

            
            
        }
        else{
            grid[x][y].clearCell();
            grid[x][y].changed = true;

            if(player == 0) this.cells1[this.placingType.valueOf()] += 1;
            else this.cells2[this.placingType.valueOf()] += 1;
        }
        this.updateRectangles(grid, rectangles);
    }

    placeCell(player:number, grid: Cell[][], rectangles:Phaser.GameObjects.Rectangle[][], x:number, y:number){
        if(player == 0){
            if(this.cells1[this.placingType.valueOf()] > 0){
                this.setCellType(player,grid, rectangles, x, y);
                this.setCellsText();
                if(this.isCellsEmpty(player)){
                    if(player == this.roundStartingPlayer){
                        this.setPlayer(1);
                        this.changeToPlacingPhase()
                    }
                    else{
                        this.setPlayer(1);
                        this.changeToSimulatingPhase()
                    }
                }
            }
        }
        else if(player == 1){
            if(this.cells2[this.placingType.valueOf()] > 0){
                this.setCellType(player, grid, rectangles, x, y);
                this.setCellsText();
                if(this.isCellsEmpty(player)){
                    if(player == this.roundStartingPlayer){
                        this.setPlayer(0);
                        this.changeToPlacingPhase()
                    }
                    else{
                        this.setPlayer(0);
                        this.changeToSimulatingPhase()
                    }
                }
            }
        }
    }


    setNeighbors(grid: Cell[][]){
        for(var i = 0; i < this.gridHeight; i++ ){
            for(var j = 0; j < this.gridWidth; j++ ){
                if(i > 0){
                    grid[i][j].neighborMoore.push(grid[i-1][j])
                    grid[i][j].neighborNeumann.push(grid[i-1][j])
                    if(j > 0){
                        grid[i][j].neighborMoore.push(grid[i-1][j-1])
                    }
                    if(j < this.gridWidth-1){
                        grid[i][j].neighborMoore.push(grid[i-1][j+1])
                    }
                }
                if(i < this.gridHeight-1){
                    grid[i][j].neighborMoore.push(grid[i+1][j])
                    grid[i][j].neighborNeumann.push(grid[i+1][j])
                    if(j > 0){
                        grid[i][j].neighborMoore.push(grid[i+1][j-1])
                    }
                    if(j < this.gridWidth-1){
                        grid[i][j].neighborMoore.push(grid[i+1][j+1])
                    }
                }
                if(j > 0){
                    grid[i][j].neighborMoore.push(grid[i][j-1])
                    grid[i][j].neighborNeumann.push(grid[i][j-1])
                }
                if(j < this.gridWidth-1){
                    grid[i][j].neighborMoore.push(grid[i][j+1])
                    grid[i][j].neighborNeumann.push(grid[i][j+1])
                }
            }
        }
    }

    changeAllCells(grid: Cell[][]){
        for(var i = 0; i < this.gridHeight; i++ ){
            for(var j = 0; j < this.gridWidth; j++ ){
                grid[i][j].changed = true;
            }
        }
    }

    clearCells(grid: Cell[][]){
        for(var i = 0; i < this.gridHeight; i++ ){
            for(var j = 0; j < this.gridWidth; j++ ){
                grid[i][j].clearCurrCell()
            }
        }
    }

    clearNextCells(grid: Cell[][]){
        for(var i = 0; i < this.gridHeight; i++ ){
            for(var j = 0; j < this.gridWidth; j++ ){
                grid[i][j].clearNextCell()
            }
        }
    }


    //counts Neumann neighbors of specific type with tier > 0
    countNeumannNeighbors(neighbors: Cell[], type:CellType):number{
        var count = 0;
        for(var i = 0; i < neighbors.length; i++){
            if(neighbors[i].currType == type && neighbors[i].currTier > 0){
                count += 1;
            }
        }
        return count;
    }

    //counts Moore neighbors of specific type in array with tier == index
    countMooreNeighbors(neighbors: Cell[], type:CellType):number[]{
        var states = new Array(3);
        states.fill(0);
        for(var i = 0; i < neighbors.length; i++){
            if(neighbors[i].currType == type){
                states[neighbors[i].currTier] += 1;
            }
        }
        return states;
    }

    checkUpgradeState(cell:Cell):[type:CellType, tier:number]{

        if(this.countMooreNeighbors(cell.neighborMoore, CellType.food)[1] > 2){
            return [CellType.food, 2]
        }
        else if(this.countMooreNeighbors(cell.neighborMoore, CellType.wood)[1] > 2){
            return [CellType.wood, 2]
        }
        else if(this.countMooreNeighbors(cell.neighborMoore, CellType.metal)[1] > 2){
            return [CellType.metal, 2]
        }
        
        if(cell.currTier == 0){
            if(this.countMooreNeighbors(cell.neighborMoore, CellType.food)[0] > 2){
                return [CellType.food, 1]
            }
            else if(this.countMooreNeighbors(cell.neighborMoore, CellType.wood)[0] > 2){
                return [CellType.wood, 1]
            }
            else if(this.countMooreNeighbors(cell.neighborMoore, CellType.metal)[0] > 2){
                return [CellType.metal, 1]
            }
        }

        if(cell.currType == CellType.none){
            if(this.countNeumannNeighbors(cell.neighborNeumann, CellType.food) > 0){
                return [CellType.food, 0]
            }
            else if(this.countNeumannNeighbors(cell.neighborNeumann, CellType.wood) > 0){
                return [CellType.wood, 0]
            }
            else if(this.countNeumannNeighbors(cell.neighborNeumann, CellType.metal) > 0){
                return [CellType.metal, 0]
            }
        }

        return [null, null]
    }

    checkDowngradeState(cell:Cell):[type:CellType, tier:number]{
        if(this.countMooreNeighbors(cell.neighborMoore, cell.currType)[cell.currTier] > 6){
            if(cell.currTier == 0){
                return [CellType.none, 0]
            }
            else{
                return [cell.currType, cell.currTier - 1]
            }
            
        }
        return [null, null]
    }

    


    calculateNextState(cell:Cell){
        let [type, tier] = [null, null]
        if(cell.currTier == 2){
            [type, tier] = this.checkDowngradeState(cell)
        }
        else{
            [type, tier] =  this.checkUpgradeState(cell)
            if(type == null){
                [type, tier] =  this.checkDowngradeState(cell)
            }
        }
        if(type != null){
            cell.setNextCell(type, tier)
        }

    }

    //Regeln
    calculateStep(grid: Cell[][]){
        for(var i = 0; i < this.gridHeight; i++ ){
            for(var j = 0; j < this.gridWidth; j++ ){
                this.calculateNextState(grid[i][j])
            }
        }
    }


    makeStep(grid: Cell[][]){
        for(var i = 0; i < this.gridHeight; i++ ){
            for(var j = 0; j < this.gridWidth; j++ ){
                if(grid[i][j].changed == true){
                    grid[i][j].setCurrCell(grid[i][j].nextType, grid[i][j].nextTier);
                    grid[i][j].clearNextCell();
                }
                
            }
        }
    }

    fullStep(grid: Cell[][], rectangles:Phaser.GameObjects.Rectangle[][]){
        this.calculateStep(grid);
        this.makeStep(grid);
        this.updateRectangles(grid , rectangles);
    }

    calculateResources(stats:CombatStats, grid:Cell[][], res:number[], resC:number[]){
        resC.fill(0);
        for(var i = 0; i < this.gridHeight; i++ ){
            for(var j = 0; j < this.gridWidth; j++ ){
                if(grid[i][j].currType < 3){
                    resC[grid[i][j].currType] += (grid[i][j].currTier + 1 + stats.resBase[grid[i][j].currType]);
                }
            }
        }
        for(var i = 0; i < res.length; i++ ){
            res[i] += resC[i];
        }
    }

    clearResources(res:number[], resC:number[]){
        res.fill(0);
        resC.fill(0);
    }

    setResourceText(stats:CombatStats, foodText: Phaser.GameObjects.Text, woodText: Phaser.GameObjects.Text, metalText: Phaser.GameObjects.Text, res:number[], resC:number[]){
        foodText.setText("Food:\n"+res[0]+"\n+"+resC[0]+"\n"+(stats.resBase[0]+1) +"/"+(stats.resBase[0]+2)+"/"+(stats.resBase[0]+3))
        woodText.setText("Wood:\n"+res[1]+"\n+"+resC[1]+"\n"+(stats.resBase[1]+1) +"/"+(stats.resBase[1]+2)+"/"+(stats.resBase[1]+3))
        metalText.setText("Metal:\n"+res[2]+"\n+"+resC[2]+"\n"+(stats.resBase[2]+1) +"/"+(stats.resBase[2]+2)+"/"+(stats.resBase[2]+3))
    }

    setPlayer(player:number){
        if(player == 1){
            // this.setCellsActive(this.rectangles2);
            // this.setCellsInactive(this.rectangles);
            //this.currentPlayerIndicator.setText(" -->")
            this.currentPlayer = 1;
        }
        else if (player == 0){
            // this.setCellsActive(this.rectangles);
            // this.setCellsInactive(this.rectangles2);
            //this.currentPlayerIndicator.setText("<-- ")
            this.currentPlayer = 0;
        }
        else{
            this.setCellsActive(this.rectangles);
            this.setCellsActive(this.rectangles2);
            //this.currentPlayerIndicator.setText("<-->")
            this.currentPlayer = 2;
        }
    }   

    //random
    randomInt(min:number, max:number):number{
        return min + Math.round(Math.random()*(max-min));
    }

    setPhaseText(){
        var player;
        if(this.currentPlayer){
            player = "Player 2"
        }
        else {
            player = "Player 1"
        }

        if(this.phase == GameState.Picking) this.phaseText.setText("Picking: " + player)
        if(this.phase == GameState.Placing) this.phaseText.setText("Placing: " + player)
        if(this.phase == GameState.Simulating) this.phaseText.setText("     Simulation")
        if(this.phase == GameState.Buying) this.phaseText.setText("Buying: " + player)
        if(this.phase == GameState.Fighting)  this.phaseText.setText("      Fight")
    }

    setPointsText(){
        this.pointsText.setText(this.points.toString());
        this.points2Text.setText(this.points2.toString());
    }

    setCellsText(){
        this.cellsText1.setText(this.cells1[0].toString() + "\n" + this.cells1[1].toString() + "\n" + this.cells1[2].toString())
        this.cellsText2.setText(this.cells2[0].toString() + "\n" + this.cells2[1].toString() + "\n" + this.cells2[2].toString())
    }

    isCellsEmpty(player:number){
        var temp:boolean;
        if(player == 0){
            temp = this.cells1[0] == 0 && this.cells1[1] == 0 && this.cells1[2] == 0
        }
        else if(player == 1){
            temp = this.cells2[0] == 0 && this.cells2[1] == 0 && this.cells2[2] == 0
        }
        return temp
    }

    generateCellPool(){
        this.pool = new Array(10);
        this.poolSize = 10;
        for(var i = 0; i < 10; i++ ){
            var type = this.randomInt(0, 2);
            var amount = this.randomInt(2, 4);
            this.pool[i] = [type, amount];
        }
        

        for(var i = 0; i < 2; i++ ){
            for(var j = 0; j < 5; j++ ){
                if(this.pool[i*5+j][0] == 0){
                    var temp = new Phaser.GameObjects.Rectangle(this,  750 + j * 100, 112 + i * 64, 32, 32, 0x556b2f, 1).setStrokeStyle(2, 0x000000, 1.0)
                }
                else if(this.pool[i*5+j][0] == 1){
                    var temp = new Phaser.GameObjects.Rectangle(this,  750 + j * 100, 112 + i * 64, 32, 32, 0xD0B49F, 1).setStrokeStyle(2, 0x000000, 1.0)
                }
                else{
                    var temp = new Phaser.GameObjects.Rectangle(this,  750 + j * 100, 112 + i * 64, 32, 32, 0x86CEFA, 1).setStrokeStyle(2, 0x000000, 1.0)
                }
                var temp2 = new Phaser.GameObjects.Text(this, 750 + j * 100 - 12, 112 + i * 64 - 12, this.pool[i*5+j][1].toString(),{fontSize: '32px', color: '#000000'}).setFill('#FFFFFF').setFontSize(24).setStroke("#000000", 4)
                this.poolRect[i*5+j] = temp
                this.poolText[i*5+j] = temp2;
            }
        }
    }

    addCells(type:number, amount:number){
        let player = this.currentPlayer;
        if(player == 0){
            this.cells1[type] += amount;
        }
        else{
            this.cells2[type] += amount;
        }
    }

    displayCellPool(){
        for(var i = 0; i < 10; i++ ){
            this.add.existing(this.poolRect[i])
            this.poolRect[i].setInteractive();
            let x = i;
            this.poolRect[i].on('pointerdown', () => {this.addCells(this.pool[x][0], this.pool[x][1]); this.poolText[x].destroy(); this.poolRect[x].destroy(); this.setPlayer(1-this.currentPlayer); this.poolSize -= 1; if(this.poolSize == 0){this.changeToPlacingPhase()};  this.setCellsText(); this.setPhaseText()})
            this.add.existing(this.poolText[i])
        }
    }

    setupShop(){

        //resource upgrades
        var foodButton = this.add.existing(new Phaser.GameObjects.Rectangle(this, 725, 244, 140, 48,  0x556b2f, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        var text  = this.add.text(0, 0, "+1 Base Food\n20W + 20M").setStroke("#000000", 4).setAlign('center');
        Phaser.Display.Align.In.Center(text, foodButton);
        foodButton.on('pointerdown', () => this.addResourceBase(CellType.food));


        const woodButton = this.add.existing(new Phaser.GameObjects.Rectangle(this, 880, 244, 140, 48,  0xD0B49F, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        var text  = this.add.text(0, 0, "+1 Base Wood\n20F + 20M").setStroke("#000000", 4).setAlign('center');
        Phaser.Display.Align.In.Center(text, woodButton);
        woodButton.on('pointerdown', () => this.addResourceBase(CellType.wood));

        const metalButton = this.add.existing(new Phaser.GameObjects.Rectangle(this, 1035, 244, 140, 48,  0x86CEFA, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        var text  = this.add.text(0, 0, "+1 Base Metal\n20F + 20W").setStroke("#000000", 4).setAlign('center');
        Phaser.Display.Align.In.Center(text, metalButton);
        metalButton.on('pointerdown', () => this.addResourceBase(CellType.metal));

        //units
        const infButton = this.add.existing(new Phaser.GameObjects.Rectangle(this, 725, 308, 140, 48,  0x555555, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        var text  = this.add.text(0, 0, "+20 Soldiers\n25F").setStroke("#000000", 4).setAlign('center');
        Phaser.Display.Align.In.Center(text, infButton);
        infButton.on('pointerdown', () => this.addStats(UnitType.soldier, UnitUpgrade.amount));

        const bowButton = this.add.existing(new Phaser.GameObjects.Rectangle(this, 880, 308, 140, 48,  0x555555, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        var text  = this.add.text(0, 0, "+10 Archers\n35F").setStroke("#000000", 4).setAlign('center');
        Phaser.Display.Align.In.Center(text, bowButton);
        bowButton.on('pointerdown', () => this.addStats(UnitType.archer, UnitUpgrade.amount));

        const kavButton = this.add.existing(new Phaser.GameObjects.Rectangle(this, 1035, 308, 140, 48,  0x555555, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        var text  = this.add.text(0, 0, "+5 Cavalry\n50F").setStroke("#000000", 4).setAlign('center');
        Phaser.Display.Align.In.Center(text, kavButton);
        kavButton.on('pointerdown', () => this.addStats(UnitType.cavalry, UnitUpgrade.amount));

        //unit damage
        const infDmgButton = this.add.existing(new Phaser.GameObjects.Rectangle(this, 725, 372, 140, 48,  0xad1d27, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        var text  = this.add.text(0, 0, "+Dmg Soldiers\n25W").setStroke("#000000", 4).setAlign('center');
        Phaser.Display.Align.In.Center(text, infDmgButton);
        infDmgButton.on('pointerdown', () => this.addStats(UnitType.soldier, UnitUpgrade.damage));

        const bowDmgButton = this.add.existing(new Phaser.GameObjects.Rectangle(this, 880, 372, 140, 48,  0xad1d27, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        var text  = this.add.text(0, 0, "+Dmg Archers\n35W").setStroke("#000000", 4).setAlign('center');
        Phaser.Display.Align.In.Center(text, bowDmgButton);
        bowDmgButton.on('pointerdown', () => this.addStats(UnitType.archer, UnitUpgrade.damage));

        const kavDmgButton = this.add.existing(new Phaser.GameObjects.Rectangle(this, 1035, 372, 140, 48,  0xad1d27, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        var text  = this.add.text(0, 0, "+Dmg Cavalry\n50W").setStroke("#000000", 4).setAlign('center');
        Phaser.Display.Align.In.Center(text, kavDmgButton);
        kavDmgButton.on('pointerdown', () => this.addStats(UnitType.cavalry, UnitUpgrade.damage));

        //unit HP
        const infHpButton = this.add.existing(new Phaser.GameObjects.Rectangle(this, 725, 436, 140, 48,  0x3e943a, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        var text  = this.add.text(0, 0, "+Hp Soldiers\n25M").setStroke("#000000", 4).setAlign('center');
        Phaser.Display.Align.In.Center(text, infHpButton);
        infHpButton.on('pointerdown', () => this.addStats(UnitType.soldier, UnitUpgrade.hp));

        const bowHpButton = this.add.existing(new Phaser.GameObjects.Rectangle(this, 880, 436, 140, 48,  0x3e943a, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        var text  = this.add.text(0, 0, "+Hp Archers\n35M").setStroke("#000000", 4).setAlign('center');
        Phaser.Display.Align.In.Center(text, bowHpButton);
        bowHpButton.on('pointerdown', () => this.addStats(UnitType.archer, UnitUpgrade.hp));

        const kavHpButton = this.add.existing(new Phaser.GameObjects.Rectangle(this, 1035, 436, 140, 48,  0x3e943a, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        var text  = this.add.text(0, 0, "+Hp Cavalry\n50M").setStroke("#000000", 4).setAlign('center');
        Phaser.Display.Align.In.Center(text, kavHpButton);
        kavHpButton.on('pointerdown', () => this.addStats(UnitType.cavalry, UnitUpgrade.hp));

        this.shopButtons.push(foodButton)
        this.shopButtons.push(woodButton)
        this.shopButtons.push(metalButton)

        this.shopButtons.push(infButton)
        this.shopButtons.push(infDmgButton)
        this.shopButtons.push(infHpButton)

        this.shopButtons.push(bowButton)
        this.shopButtons.push(bowDmgButton)
        this.shopButtons.push(bowHpButton)

        this.shopButtons.push(kavButton)
        this.shopButtons.push(kavDmgButton)
        this.shopButtons.push(kavHpButton)

    }

    

    setShopActive(){
        for(var i = 0; i < this.shopButtons.length; i++ ){
            this.shopButtons[i].setInteractive();
        }
    }
    setShopInactive(){
        for(var i = 0; i < this.shopButtons.length; i++ ){
            this.shopButtons[i].disableInteractive();
        }
    }


    getStats(){
        if(this.currentPlayer == 0) return this.stats1;
        else return this.stats2;
    }

    getRessources(){
        if(this.currentPlayer == 0) return this.resources;
        else return this.resources2;
    }

    addStats(type:UnitType, upgrade:UnitUpgrade ){
        var stats = this.getStats();
        var res = this.getRessources()

        if(type == UnitType.soldier){
            if(upgrade == UnitUpgrade.amount && res[0]>= 25) {stats.soldierAmount += 20; res[0] -= 25;}
            if(upgrade == UnitUpgrade.damage && res[1]>= 25) {stats.soldierDamage += 1;  res[1] -= 25;}
            if(upgrade == UnitUpgrade.hp && res[2]>= 25) {stats.soldierHp += 5;  res[2] -= 25;}
        }
        else if(type == UnitType.archer){
            if(upgrade == UnitUpgrade.amount && res[0]>= 35) {stats.archerAmount += 10;  res[0] -= 35;}
            if(upgrade == UnitUpgrade.damage && res[1]>= 35) {stats.archerDamage += 2;  res[1] -= 35;}
            if(upgrade == UnitUpgrade.hp && res[2]>= 35) {stats.archerHp += 5;  res[1] -= 35;}
        }
        else if(type == UnitType.cavalry){
            if(upgrade == UnitUpgrade.amount && res[0]>= 50) {stats.cavalryAmount += 5;  res[0] -= 50;}
            if(upgrade == UnitUpgrade.damage && res[1]>= 50) {stats.cavalryDamage += 5;  res[1] -= 50;}
            if(upgrade == UnitUpgrade.hp && res[2]>= 50) {stats.cavalryHp += 10;  res[2] -= 50;}
        }
        this.setResourceText(this.stats1, this.foodText1, this.woodText1, this.metalText1, this.resources, this.resourcesChange);
        this.setResourceText(this.stats2, this.foodText2, this.woodText2, this.metalText2, this.resources2, this.resourcesChange2);

        this.setFightText(this.stats1, this.stats2)
    }

    addResourceBase(type: CellType){
        var stats = this.getStats();
        var res = this.getRessources();

        if(type == CellType.food && res[1] >= 20 && res[2] >= 20) {stats.resBase[0] += 1; res[1] -= 20; res[2] -= 20}
        if(type == CellType.wood && res[0] >= 20 && res[2] >= 20) {stats.resBase[1] += 1;  res[0] -= 20;  res[2] -= 20}
        if(type == CellType.metal && res[0] >= 20 && res[1] >= 20) {stats.resBase[2] += 1; res[0] -= 20; res[1] -= 20}

        this.setResourceText(this.stats1, this.foodText1, this.woodText1, this.metalText1, this.resources, this.resourcesChange);
        this.setResourceText(this.stats2, this.foodText2, this.woodText2, this.metalText2, this.resources2, this.resourcesChange2);
    }

    readyButtonFunc(){
        this.readyButton.disableInteractive();
        if(this.currentPlayer == this.roundStartingPlayer){
            this.setPlayer(1-this.currentPlayer);
            this.changeToBuyingPhase()
        }
        else{
            this.changeToFightingPhase();
        }
    }

    setupFight(){
        this.fightRoundRect = this.add.existing(new Phaser.GameObjects.Rectangle(this, 950, 596, 160, 32,  0x333333, 1).setOrigin(0.5,0).setStrokeStyle(2, 0x000000, 1.0));
        this.fightRoundText = this.add.text(0, 0, "Round 1").setStroke("#000000", 4).setAlign('center');
        Phaser.Display.Align.In.Center(this.fightRoundText, this.fightRoundRect);

        this.fightSplitRect = this.add.existing(new Phaser.GameObjects.Rectangle(this, 950, 628, 120, 120,  0x333333, 1).setOrigin(0.5,0).setStrokeStyle(2, 0x000000, 1.0));
        this.fightSplitText = this.add.text(0, 0, "None\nNone\nNone").setStroke("#000000", 4).setAlign('center');
        Phaser.Display.Align.In.Center(this.fightSplitText, this.fightSplitRect);

        var soldier1 = this.add.existing(new Phaser.GameObjects.Rectangle(this, 710, 596, 120, 32,  0x333333, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        this.fightRect1.push(this.add.existing(new Phaser.GameObjects.Rectangle(this, 710, 628, 120, 32,  0x555555, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0)));
        this.fightRect1.push(this.add.existing(new Phaser.GameObjects.Rectangle(this, 710, 660, 60, 32,  0xad1d27, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0)));
        this.fightRect1.push(this.add.existing(new Phaser.GameObjects.Rectangle(this, 770, 660, 60, 32,  0x3e943a, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0)));
        var text  = this.add.text(0, 0, "Soldiers").setStroke("#000000", 4).setAlign('center');
        this.fightText1.push(this.add.text(0, 0, "0 a").setStroke("#000000", 4).setAlign('center'));
        this.fightText1.push(this.add.text(0, 0, "0 d").setStroke("#000000", 4).setAlign('center'));
        this.fightText1.push(this.add.text(0, 0, "0 h").setStroke("#000000", 4).setAlign('center'));
        Phaser.Display.Align.In.Center(text, soldier1);
        Phaser.Display.Align.In.Center(this.fightText1[0], this.fightRect1[0]);
        Phaser.Display.Align.In.Center(this.fightText1[1], this.fightRect1[1]);
        Phaser.Display.Align.In.Center(this.fightText1[2], this.fightRect1[2]);

        var archer1 = this.add.existing(new Phaser.GameObjects.Rectangle(this, 710, 708, 120, 32,  0x333333, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        this.fightRect1.push(this.add.existing(new Phaser.GameObjects.Rectangle(this, 710, 740, 120, 32,  0x555555, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0)));
        this.fightRect1.push(this.add.existing(new Phaser.GameObjects.Rectangle(this, 710, 772, 60, 32,  0xad1d27, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0)));
        this.fightRect1.push(this.add.existing(new Phaser.GameObjects.Rectangle(this, 770, 772, 60, 32,  0x3e943a, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0)));
        var text  = this.add.text(0, 0, "Archers").setStroke("#000000", 4).setAlign('center');
        this.fightText1.push(this.add.text(0, 0, "0 a").setStroke("#000000", 4).setAlign('center'));
        this.fightText1.push(this.add.text(0, 0, "0 d").setStroke("#000000", 4).setAlign('center'));
        this.fightText1.push(this.add.text(0, 0, "0 h").setStroke("#000000", 4).setAlign('center'));
        Phaser.Display.Align.In.Center(text, archer1);
        Phaser.Display.Align.In.Center(this.fightText1[3], this.fightRect1[3]);
        Phaser.Display.Align.In.Center(this.fightText1[4], this.fightRect1[4]);
        Phaser.Display.Align.In.Center(this.fightText1[5], this.fightRect1[5]);

        var cavalry1 = this.add.existing(new Phaser.GameObjects.Rectangle(this, 710, 820, 120, 32,  0x333333, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0));
        this.fightRect1.push(this.add.existing(new Phaser.GameObjects.Rectangle(this, 710, 852, 120, 32,  0x555555, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0)));
        this.fightRect1.push(this.add.existing(new Phaser.GameObjects.Rectangle(this, 710, 884, 60, 32,  0xad1d27, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0)));
        this.fightRect1.push(this.add.existing(new Phaser.GameObjects.Rectangle(this, 770, 884, 60, 32,  0x3e943a, 1).setOrigin(0).setStrokeStyle(2, 0x000000, 1.0)));
        var text  = this.add.text(0, 0, "Cavalry").setStroke("#000000", 4).setAlign('center');
        this.fightText1.push(this.add.text(0, 0, "0 a").setStroke("#000000", 4).setAlign('center'));
        this.fightText1.push(this.add.text(0, 0, "0 d").setStroke("#000000", 4).setAlign('center'));
        this.fightText1.push(this.add.text(0, 0, "0 h").setStroke("#000000", 4).setAlign('center'));
        Phaser.Display.Align.In.Center(text, cavalry1);
        Phaser.Display.Align.In.Center(this.fightText1[6], this.fightRect1[6]);
        Phaser.Display.Align.In.Center(this.fightText1[7], this.fightRect1[7]);
        Phaser.Display.Align.In.Center(this.fightText1[8], this.fightRect1[8]);


        //player 2
        var soldier2 = this.add.existing(new Phaser.GameObjects.Rectangle(this, 1190, 596, 120, 32,  0x333333, 1).setOrigin(1,0).setStrokeStyle(2, 0x000000, 1.0));
        this.fightRect2.push(this.add.existing(new Phaser.GameObjects.Rectangle(this, 1190, 628, 120, 32,  0x555555, 1).setOrigin(1,0).setStrokeStyle(2, 0x000000, 1.0)));
        this.fightRect2.push(this.add.existing(new Phaser.GameObjects.Rectangle(this, 1190, 660, 60, 32,  0xad1d27, 1).setOrigin(1,0).setStrokeStyle(2, 0x000000, 1.0)));
        this.fightRect2.push(this.add.existing(new Phaser.GameObjects.Rectangle(this, 1130, 660, 60, 32,  0x3e943a, 1).setOrigin(1,0).setStrokeStyle(2, 0x000000, 1.0)));
        var text  = this.add.text(0, 0, "Soldiers").setStroke("#000000", 4).setAlign('center');
        this.fightText2.push(this.add.text(0, 0, "0 a").setStroke("#000000", 4).setAlign('center'));
        this.fightText2.push(this.add.text(0, 0, "0 d").setStroke("#000000", 4).setAlign('center'));
        this.fightText2.push(this.add.text(0, 0, "0 h").setStroke("#000000", 4).setAlign('center'));
        Phaser.Display.Align.In.Center(text, soldier2);
        Phaser.Display.Align.In.Center(this.fightText2[0], this.fightRect2[0]);
        Phaser.Display.Align.In.Center(this.fightText2[1], this.fightRect2[1]);
        Phaser.Display.Align.In.Center(this.fightText2[2], this.fightRect2[2]);

        var archer2 = this.add.existing(new Phaser.GameObjects.Rectangle(this, 1190, 708, 120, 32,  0x333333, 1).setOrigin(1,0).setStrokeStyle(2, 0x000000, 1.0));
        this.fightRect2.push(this.add.existing(new Phaser.GameObjects.Rectangle(this, 1190, 740, 120, 32,  0x555555, 1).setOrigin(1,0).setStrokeStyle(2, 0x000000, 1.0)));
        this.fightRect2.push(this.add.existing(new Phaser.GameObjects.Rectangle(this, 1190, 772, 60, 32,  0xad1d27, 1).setOrigin(1,0).setStrokeStyle(2, 0x000000, 1.0)));
        this.fightRect2.push(this.add.existing(new Phaser.GameObjects.Rectangle(this, 1130, 772, 60, 32,  0x3e943a, 1).setOrigin(1,0).setStrokeStyle(2, 0x000000, 1.0)));
        var text  = this.add.text(0, 0, "Archers").setStroke("#000000", 4).setAlign('center');
        this.fightText2.push(this.add.text(0, 0, "0 a").setStroke("#000000", 4).setAlign('center'));
        this.fightText2.push(this.add.text(0, 0, "0 d").setStroke("#000000", 4).setAlign('center'));
        this.fightText2.push(this.add.text(0, 0, "0 h").setStroke("#000000", 4).setAlign('center'));
        Phaser.Display.Align.In.Center(text, archer2);
        Phaser.Display.Align.In.Center(this.fightText2[3], this.fightRect2[3]);
        Phaser.Display.Align.In.Center(this.fightText2[4], this.fightRect2[4]);
        Phaser.Display.Align.In.Center(this.fightText2[5], this.fightRect2[5]);

        var cavalry2 = this.add.existing(new Phaser.GameObjects.Rectangle(this, 1190, 820, 120, 32,  0x333333, 1).setOrigin(1,0).setStrokeStyle(2, 0x000000, 1.0));
        this.fightRect2.push(this.add.existing(new Phaser.GameObjects.Rectangle(this, 1190, 852, 120, 32,  0x555555, 1).setOrigin(1,0).setStrokeStyle(2, 0x000000, 1.0)));
        this.fightRect2.push(this.add.existing(new Phaser.GameObjects.Rectangle(this, 1190, 884, 60, 32,  0xad1d27, 1).setOrigin(1,0).setStrokeStyle(2, 0x000000, 1.0)));
        this.fightRect2.push(this.add.existing(new Phaser.GameObjects.Rectangle(this, 1130, 884, 60, 32,  0x3e943a, 1).setOrigin(1,0).setStrokeStyle(2, 0x000000, 1.0)));
        var text  = this.add.text(0, 0, "Cavalry").setStroke("#000000", 4).setAlign('center');
        this.fightText2.push(this.add.text(0, 0, "2").setStroke("#000000", 4).setAlign('center'));
        this.fightText2.push(this.add.text(0, 0, "2").setStroke("#000000", 4).setAlign('center'));
        this.fightText2.push(this.add.text(0, 0, "2").setStroke("#000000", 4).setAlign('center'));
        Phaser.Display.Align.In.Center(text, cavalry2);
        Phaser.Display.Align.In.Center(this.fightText2[6], this.fightRect2[6]);
        Phaser.Display.Align.In.Center(this.fightText2[7], this.fightRect2[7]);
        Phaser.Display.Align.In.Center(this.fightText2[8], this.fightRect2[8]);

        this.setFightText(this.stats1, this.stats2)
        this.setRoundText()
    }

    setFightText(stats1:CombatStats, stats2:CombatStats){
        this.fightText1[0].setText(stats1.soldierAmount.toString());
        this.fightText1[1].setText(stats1.soldierDamage.toString());
        this.fightText1[2].setText(stats1.soldierHp.toString());

        this.fightText1[3].setText(stats1.archerAmount.toString());
        this.fightText1[4].setText(stats1.archerDamage.toString());
        this.fightText1[5].setText(stats1.archerHp.toString());
        
        this.fightText1[6].setText(stats1.cavalryAmount.toString());
        this.fightText1[7].setText(stats1.cavalryDamage.toString());
        this.fightText1[8].setText(stats1.cavalryHp.toString());

        this.fightText2[0].setText(stats2.soldierAmount.toString());
        this.fightText2[1].setText(stats2.soldierDamage.toString());
        this.fightText2[2].setText(stats2.soldierHp.toString());

        this.fightText2[3].setText(stats2.archerAmount.toString());
        this.fightText2[4].setText(stats2.archerDamage.toString());
        this.fightText2[5].setText(stats2.archerHp.toString());
        
        this.fightText2[6].setText(stats2.cavalryAmount.toString());
        this.fightText2[7].setText(stats2.cavalryDamage.toString());
        this.fightText2[8].setText(stats2.cavalryHp.toString());

        for(var i = 0; i < this.fightRect1.length; i++ ){
            Phaser.Display.Align.In.Center(this.fightText1[i], this.fightRect1[i]);
            Phaser.Display.Align.In.Center(this.fightText2[i], this.fightRect2[i]);
        }
        
    }

    setRoundText(){
        this.fightRoundText.setText("Round "+ this.fightRound)
        if(this.fightPhase == FightPhase.None ) this.fightSplitText.setText("\nNone\n");
        else if(this.fightPhase == FightPhase.AfterRound){
            if(this.lastRoundWon == 0) this.fightSplitText.setText("Player 1\nwon this\nRound");
            if(this.lastRoundWon == 1) this.fightSplitText.setText("Player 2\nwon this\nRound");
            if(this.lastRoundWon == 2) this.fightSplitText.setText("\nDraw\n");
        }
        else if(this.fightPhase == FightPhase.Cavalry) this.fightSplitText.setText("After\nCavalry\nAttack");
        else if(this.fightPhase == FightPhase.Archers) this.fightSplitText.setText("After\nArcher\nAttack");
        else if(this.fightPhase == FightPhase.Soldiers) this.fightSplitText.setText("After\nSoldier\nAttack");
        Phaser.Display.Align.In.Center(this.fightSplitText, this.fightSplitRect);
    }

    calculateFight(stats1:CombatStats, stats2:CombatStats): boolean{
        var player1Won = false;
        var player2Won = false;
        if(this.fightPhase == FightPhase.None|| this.fightPhase == FightPhase.AfterRound || this.fightPhase == FightPhase.Soldiers){
            this.fightRound += 1;
            this.fightPhase = FightPhase.Cavalry;
            this.setRoundText();
            var damagePlayer1 = stats1.cavalryAmount * stats1.cavalryDamage;
            var damagePlayer2 = stats2.cavalryAmount * stats2.cavalryDamage;
            player1Won = this.takeDamage(damagePlayer1, stats2)
            player2Won = this.takeDamage(damagePlayer2, stats1)
        }
        else if(this.fightPhase == FightPhase.Cavalry){
            this.fightPhase = FightPhase.Archers;
            this.setRoundText();
            var damagePlayer1 = stats1.archerAmount * stats1.archerDamage;
            var damagePlayer2 = stats2.archerAmount * stats2.archerDamage;
            player1Won = this.takeDamage(damagePlayer1, stats2)
            player2Won = this.takeDamage(damagePlayer2, stats1)
        }
        else if(this.fightPhase == FightPhase.Archers){
            this.fightPhase = FightPhase.Soldiers;
            this.setRoundText();
            var damagePlayer1 = stats1.soldierAmount * stats1.soldierDamage;
            var damagePlayer2 = stats2.soldierAmount * stats2.soldierDamage;
            player1Won = this.takeDamage(damagePlayer1, stats2)
            player2Won = this.takeDamage(damagePlayer2, stats1)
        }
        this.setFightText(stats1, stats2)
        if(player1Won && player2Won){
            this.points += 1;
            this.points2 += 1;
            this.lastRoundWon = 2;
            return true;
        }
        else if(player1Won){
            this.points += 1;
            this.lastRoundWon = 0;
            return true;
        }
        else if(player2Won){
            this.points2 += 1;
            this.lastRoundWon = 1;
            return true;
        }
        return false;
    }

    takeDamage(amount:number, stats:CombatStats): boolean{
        while(amount > 0){
            if(stats.soldierAmount > 0){
                amount -= stats.soldierHp;
                stats.soldierAmount -= 1;
            }
            else if(stats.archerAmount > 0){
                amount -= stats.archerHp;
                stats.archerAmount -= 1;
            }
            else if(stats.cavalryAmount > 0){
                amount -= stats.cavalryHp;
                stats.cavalryAmount -= 1;
            }
            else{
                return true;
                break;
            }
        }
        if(stats.cavalryAmount <= 0 && stats.archerAmount <= 0 && stats.soldierAmount <= 0) return true;
        return false;
    }




    changeToPhase(phase:GameState){
        if(phase == GameState.Picking) this.changeToPickingPhase();
        else if(phase == GameState.Placing) this.changeToPlacingPhase();
        else if(phase == GameState.Simulating) this.changeToSimulatingPhase();
        else if(phase == GameState.Buying) this.changeToBuyingPhase();
        else if(phase == GameState.Fighting) this.changeToFightingPhase();
        this.setPhaseText();
    }

    changeToPickingPhase(){
        this.phase = GameState.Picking;
        this.setPlayer(this.roundStartingPlayer)
        this.setPhaseText();
        this.setPointsText();
        

        this.setCellsInactive(this.rectangles)
        this.setCellsInactive(this.rectangles2)
        this.generateCellPool()
        this.displayCellPool()

        this.clearCells(this.grid);
        this.clearNextCells(this.grid); 
        this.updateRectangles(this.grid, this.rectangles);

        this.clearCells(this.grid2);
        this.clearNextCells(this.grid2); 
        this.updateRectangles(this.grid2, this.rectangles2);

        this.fightRound = 0;
        
        if(this.fightPhase != FightPhase.None){
            this.fightPhase = FightPhase.AfterRound;
        }
        this.setRoundText()
        this.setFightText(this.stats1, this.stats2);
        
    }



    changeToPlacingPhase(){
        this.phase = GameState.Placing;
        if(this.currentPlayer == 0){
            this.setCellsActive(this.rectangles);
            this.setCellsInactive(this.rectangles2);
        } 
        else if(this.currentPlayer == 1) {
            this.setCellsActive(this.rectangles2);
            this.setCellsInactive(this.rectangles)
        }
        this.setPhaseText();
    }

    changeToSimulatingPhase(){
        this.phase = GameState.Simulating;
        this.setPhaseText();
        this.playing = true;
        this.timer = 0;
        this.stepCounter = 0;
    }
    
    changeToBuyingPhase(){
        this.phase = GameState.Buying;
        this.readyButton.setInteractive();
        this.setPhaseText();
        this.setShopActive();
    }

    changeToFightingPhase(){
        this.phase = GameState.Fighting;
        this.tempStats1.copyStats(this.stats1);
        this.tempStats2.copyStats(this.stats2);
        this.fighting = true;
        this.timer = 0;
        this.setPhaseText();
    }

}

const config = {
    type: Phaser.AUTO,
    backgroundColor: '#AAAAAA',
    width: 1900,
    height: 940,
    scene: Demo,
    fps: { forceSetTimeOut: true, target: 10 }
};

const game = new Phaser.Game(config);
