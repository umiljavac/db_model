class Field {
        constructor(domElt,ctn) {
                this.domElt = domElt;
                this.ctn = ctn;
                this.isBaseField = true;
                this.init();
        }
        init() {
                this.domElt.addEventListener('input', (e) => {
                        this.ctn = e.target.innerHTML;
                })
        }
}

class PKField extends Field {
        constructor(domElt, name) {
                super(domElt, name);
                this.isPKField = true;
                this.primary = undefined;
                this.parsePK()
        }
        parsePK() {
                const regex = /(\w+) PRIMARY/i;
                let res = this.ctn.match(regex); 
                this.primary = res[1];
        }
}

class FKField extends Field {
        constructor(domElt, name) {
                super(domElt, name);
                this.isFKField = true;
                this.originField = undefined;
                this.destTable = undefined;
                this.destField = undefined;
                this.parseFK();
        } 

        parseFK() {
                const regex = /(\w+) REFERENCE (\w+) \((\w+)\)/i;
                let res = this.ctn.match(regex);
                if(!res)
                        throw `Foreign key [ ${this.ctn} ] is not well defined`
                this.originField = res[1];
                this.destTable = res[2];
                this.destField = res[3];
        }
}

class KField extends Field {
        constructor(domElt, name) {
                super(domElt, name);
                this.isKField = true;
        } 
}

class FieldCollection extends Array {
        constructor(...items) {
                super(...items)
        }
        add(field) {
                if(field instanceof Field)
                        this.push(field);
        }
}



class TableCollection extends Array {
        constructor(sketch,...items) {
                super(...items);
                this.sketch = sketch;
                this.cur_tbl = undefined;
                this.currentRowCountTables = 0;
                this.redraw = document.getElementById('redraw_links');
        }
        add(tableName) {
                //this.adjustTablePositionOnDataParse(table);

                let checkName = tableName instanceof MouseEvent ? '' : tableName;
                const index = this.getNewIndex();
                const table = new Table(index, this.sketch, checkName);

                this.push(table);

                this.dragElement(table.tbl);

                table.tbl.querySelector('.tbl-selector').addEventListener('click', (e) => {
                        if(this.cur_tbl !== undefined)
                                this.cur_tbl.tbl.classList.remove('on');

                        e.target.parentElement.classList.add('on');
                        this.cur_tbl = table;
                        this.showTblInfos(table.tbl.getAttribute('index'));
                });
                return table;
        }
        getNewIndex() {
                return this.length;
        }
        dragElement(elt) {
                const me = this;

                let pX, pY; 
                let index = elt.getAttribute('index');
                const table = this[index];
                elt.querySelector('.tbl-selector').onmousedown = dragMouseDown;
              
                function dragMouseDown(e) {
                        
                        e.preventDefault();
                        pX = e.offsetX - window.scrollX;
                        pY = e.offsetY - window.scrollY;

                        document.onmouseup = closeDragElement;
                        document.onmousemove = elementDrag;
                        // send event to clear canvas
                        const redraw = new CustomEvent('redraw', { detail: 'clearCanvas' } );
                        me.redraw.dispatchEvent(redraw)
                }
              
                function elementDrag(e) {
                        e.preventDefault();
                        
                        me.showTblInfos(index);
                        table.refreshSizeAndPosition();
                        elt.style.left = (e.clientX - pX - 7) + "px";                        
                        elt.style.top = (e.clientY - pY + 10) + "px";

                       
                }
              
                function closeDragElement() {
                        document.onmouseup = null;
                        document.onmousemove = null;
                        // send event to redraw canvas
                        const redraw = new CustomEvent('redraw', { detail: 'initJoins' } );
                        me.redraw.dispatchEvent(redraw)
                }
        }

        showTblInfos(index) {
                document.getElementById('curr_tbl_infos').innerHTML = '';
                const tbl = this[index];
                const template = `
                        <div class="curr-tbl-info">name: ${ tbl.id }<span id="log_tables"></span></div>
                        <div class="curr-tbl-info">index: ${ tbl.index }</div>
                        <div class="curr-tbl-info flex-sb">
                                <div>x: ${ Math.round(tbl.x * 1000) / 1000 }</div>
                                <div> y: ${ Math.round(tbl.y * 1000) / 1000 }</div>
                                <div>w: ${ tbl.width }</div>
                                <div>h: ${ tbl.height }</div>
                        </div>
                `
                document.getElementById('curr_tbl_infos').innerHTML = template;
                document.getElementById('log_tables').addEventListener('click', (e) => {
                        console.log(tbl); 
                })
        }
        setCommonFieldAttribute(field,ctn) {
                field.setAttribute('contenteditable', true);
                field.setAttribute('autocorrect','off');
                field.setAttribute('spellcheck',"false");
                if(typeof ctn === 'string')
                        field.innerHTML = ctn
        }

        addField(ctn) {
                if(this.cur_tbl !== undefined) {
                        const field = document.createElement('span');
                        field.classList.add('tbl-field');
                        this.setCommonFieldAttribute(field,ctn);
                        this.cur_tbl.tbl.querySelector('.tbl-fields').appendChild(field);
                        this.cur_tbl.fields.add(new Field(field,ctn))
                } else {
                        throw 'no table selected';
                }
        }

        addPrimaryKey(ctn) {
                if(this.cur_tbl !== undefined) {
                        const field = document.createElement('span');
                        field.classList.add('pk-field');
                        this.setCommonFieldAttribute(field,ctn);
                        this.cur_tbl.tbl.querySelector('.pk-fields').appendChild(field);
                        this.cur_tbl.pkFields.add(new PKField(field,ctn));

                } else {
                        throw 'no table selected';
                }
        }
        addForeignKey(ctn) {
                if(this.cur_tbl !== undefined) {
                        const field = document.createElement('span');
                        field.classList.add('fk-field');
                        this.setCommonFieldAttribute(field,ctn);
                        this.cur_tbl.tbl.querySelector('.fk-fields').appendChild(field);
                        this.cur_tbl.fkFields.add(new FKField(field,ctn));

                } else {
                        throw 'no table selected';
                }
        }

        adjustTablePositionOnDataParse(table) {
                const margin = 50;
                if(this.length === 1) {
                        table.proxy.x = table.x;
                        table.proxy.y = table.y;

                }
                if(this[table.index - 1] != undefined) {
                        const prevTbl = this[table.index - 1];
                        if (prevTbl.x + margin + prevTbl.width + table.width > window.innerWidth) {
                                        let highestTbl = this.getHighestPrevTbl(this.currentRowCountTables,prevTbl.index);
                                        this.currentRowCountTables = table.index;

                                        table.proxy.x = table.x;
                                        table.proxy.y = highestTbl.height + prevTbl.y + margin;

                        } else {
                                        table.proxy.x = prevTbl.width + prevTbl.x + margin;
                                        table.proxy.y = prevTbl.y;
                        } 
                }
        }

        refreshGrips() {
                for (let [gripName,gripObj] of Object.entries(this.cur_tbl.grips)) {
                        gripObj.refresh();
                }
        }

        getHighestPrevTbl(from,to) {
                let highest = this[from];
                for (let i = from; i <= to ; i++) {
                        if (this[i].height > highest.height)
                                highest = this[i];
                }
                return highest;
        }

        find(id) {
                let match = undefined;
                this.forEach( (tbl) => {
                        if (tbl.id === id) 
                        match = tbl 
                })
                return match;
        }
        refreshAllPosition() {
                this.forEach( (tbl) => {
                        tbl.refreshSizeAndPosition();
                })
        }
}

class BaseGrip {
        constructor(table) {
                this.table = table;
                this.grip = document.createElement('div');
                this.grip.classList.add('grip')
                this.table.tbl.appendChild(this.grip);
                this.refPos = {};
        }

}
class TopGrip extends BaseGrip {
        constructor(table) {
                super(table);
                this.height = 20;
                this.width = 40;
                this.type = 'top';
                this.init();
        }
        init() {
                this.grip.classList.add('h-grip');
                this.refresh();
        }
        refresh() {
                this.grip.style.top = - this.height + 'px';
                let posX = this.table.width / 2 - this.width / 2;
                this.grip.style.left = posX + 'px';

                this.refPos.x = this.table.x + posX + this.width / 2;
                this.refPos.y = this.table.y;
                

        }
}
class BottomGrip extends BaseGrip {
        constructor(table) {
                super(table);
                this.height = 20;
                this.width = 40;
                this.type = 'bottom'
                this.init();
        }
        init() {
                this.grip.classList.add('h-grip');
                this.refresh();
        }
        refresh() {
                this.grip.style.top = this.table.height + 'px';
                let posX = this.table.width / 2 - this.width / 2;
                this.grip.style.left = posX + 'px';

                this.refPos.x = this.table.x + posX + this.width / 2;
                this.refPos.y = this.table.y + this.table.height;
        }
}
class LeftGrip extends BaseGrip {
        constructor(table) {
                super(table);
                this.height = 40;
                this.width = 20;
                this.type = 'left';
                this.init();
        }
        init() {
                this.grip.classList.add('w-grip');
                this.refresh();
        }
        refresh() {
                let posY = this.table.height / 2 - this.height / 2;
                this.grip.style.top = posY + 'px';
                this.grip.style.left = - this.width + 'px';
                
                this.refPos.x = this.table.x;
                this.refPos.y = this.table.y + this.table.height / 2;
        }
}

class RightGrip extends BaseGrip {
        constructor(table) {
                super(table);
                this.height = 40;
                this.width = 20;
                this.type = 'right';
                this.init();
        }
        init() {
                this.grip.classList.add('w-grip');
                this.refresh();
        }
        refresh() {
                let posY = this.table.height / 2 - this.height / 2;
                this.grip.style.top = posY + 'px';
                this.grip.style.left = this.table.width + 'px';

                this.refPos.x = this.table.x + this.table.width;
                this.refPos.y = this.table.y + this.table.height / 2;
        }
}

class Table {
        constructor(index, sketch, tableName) {
                this.sketch = sketch;
                this.tbl = undefined;
                this.id = tableName;
                this.name = tableName;
                this.fields = new FieldCollection();
                this.pkFields = new FieldCollection();
                this.fkFields = new FieldCollection();
                this.kFields = new FieldCollection();
                this.x = undefined;
                this.y = undefined;
                this.width = undefined;
                this.height = undefined;
                this.index = index;
                this.grips = {};
                this.fkJoinColor = undefined;
                this.proxy = undefined;
                this.initProxy();
                this.build(index);
                this.buildGrips();
        }
        initProxy() {
                this.proxy = new Proxy(this, {
                        get(target, prop ) {
                                return target[prop];
                        },
                        set(target, prop, value) {
                                if(prop === 'x') {
                                        target.tbl.style.left = value + 'px';
                                }
                                if(prop === 'y') {
                                        target.tbl.style.top = value + 'px';
                                }
                                target[prop] = value;
                                return true;
                        }
                })
        }
        build(index) {
                this.tbl = this.tableTemplate(this.name);
                this.tbl.setAttribute('index', index);
                this.sketch.appendChild(this.tbl);
                this.refreshSizeAndPosition();
        }
        buildGrips() {
                this.grips.top = new TopGrip(this);
                this.grips.bottom = new BottomGrip(this);
                this.grips.left = new LeftGrip(this);
                this.grips.right = new RightGrip(this);


        }
        highlightPrimaryKey() {
                this.pkFields.forEach( (pkf) => {
                        let regex = new RegExp(`^${pkf.primary} `)
                        this.fields.forEach( (f) => {
                                if (f.ctn.match(regex)) {
                                        f.domElt.classList.add('primary-key');
                                }
                        })
                });
        }
        refreshSizeAndPosition() {
                let pos = this.tbl.getBoundingClientRect();
                this.x = pos.x + window.scrollX;
                this.y = pos.y + window.scrollY;
                this.width = this.tbl.offsetWidth;
                this.height = this.tbl.offsetHeight;
                for (let [k,v] of Object.entries(this.grips)) {
                        v.refresh();
                }
                
        }
        
        getPos() {
                this.refreshSizeAndPosition();
                return {
                        x: this.x,
                        y: this.y,
                        width: this.width,
                        height: this.height
                }
        }
        tableTemplate (tableName) {
                const tbl = document.createElement('div');
                tbl.classList.add('common-tbl');

                const selector = document.createElement('div');
                selector.classList.add('tbl-selector');
                tbl.appendChild(selector);

                const name = document.createElement('div');
                name.classList.add('tbl-name');
                tbl.appendChild(name);

                const nameIn = document.createElement('span');
                nameIn.classList.add('tbl-input');
                nameIn.setAttribute('contenteditable', true);
                nameIn.setAttribute('autocorrect','off');
                nameIn.setAttribute('spellcheck',"false");
                nameIn.innerHTML = tableName;

                name.appendChild(nameIn);

                const fields = document.createElement('div');
                fields.classList.add('tbl-fields');
                tbl.appendChild(fields);

                const pks = document.createElement('div');
                pks.classList.add('pk-fields');
                tbl.appendChild(pks);

                const fks = document.createElement('div');
                fks.classList.add('fk-fields');
                tbl.appendChild(fks);

                return tbl;
        }
}
const uml = {
        add_tbl: document.getElementById('add_table'),
        add_field: document.getElementById('add_field'),
        add_pk: document.getElementById('add_pk'),
        add_fk: document.getElementById('add_fk'),
        add_cvs: document.getElementById('add_cvs'),

        sketch: document.getElementById('sketch'),

        tables: new TableCollection(this.sketch),
        tbl_gap: 50,

        cvs: undefined,

        initCanvas: function() {
                this.cvs = new Cvs(this.tables);
        },
        
        canvasToggle: function() {
                this.cvs.on = !this.cvs.on;
                if(this.cvs.on) {
                        this.add_cvs.classList.add('on');
                        this.cvs.c.style.zIndex = 1;
                }
                else {
                        this.cvs.c.style.zIndex = 0;
                        this.add_cvs.classList.remove('on');
                }
        },
        listenMenus: function() {
                this.add_tbl.addEventListener('click', this.tables.add.bind(this.tables));
                this.add_field.addEventListener('click', this.tables.addField.bind(this.tables));
                this.add_pk.addEventListener('click', this.tables.addPrimaryKey.bind(this.tables));
                this.add_fk.addEventListener('click', this.tables.addForeignKey.bind(this.tables));
                this.add_cvs.addEventListener('click', this.canvasToggle.bind(this));
        },

        parseData: function(datas) {
                for( let [k,v] of Object.entries(datas)) {
                        let table = this.tables.add(k);
                        this.tables.cur_tbl = table;
                        
                        if(v.fields !== undefined) {
                                for (let [field, desc] of Object.entries(v.fields)) {
                                        this.tables.addField(field + ' ' + desc);
                                }
                        }
                        if(v.pks != undefined) {
                                for (let [field, desc] of Object.entries(v.pks)) {
                                        this.tables.addPrimaryKey(field + ' ' + desc);
                                }
                        }
                        if(v.fks !== undefined) {
                                for (let [field, desc] of Object.entries(v.fks)) {
                                        this.tables.addForeignKey(field + ' ' + desc);
                                }
                        }

                        this.tables.cur_tbl.refreshSizeAndPosition();
                        this.tables.cur_tbl.highlightPrimaryKey();
                        this.tables.adjustTablePositionOnDataParse(this.tables.cur_tbl)
                        this.tables.refreshGrips();
                }

                this.tables.cur_tbl = undefined;

                this.tables.refreshAllPosition();
        }
}

class Cvs {
        constructor(tables) {
                this.app = document.getElementById('app');
                this.width = this.app.getBoundingClientRect().width;
                this.height = this.app.getBoundingClientRect().height;
                this.tables = tables;
                this.c = document.getElementById('canvas');
                this.ctx = undefined;
                this.on = false;
                this.redraw = document.getElementById('redraw_links');
                this.linkPaths = {};
                this.init();
        }
        init() {
                if (this.c.getContext) {

                        this.c.setAttribute('width',this.width);
                        this.c.setAttribute('height',this.height);

                        this.ctx = this.c.getContext('2d');

                        //this.listenLines();
                        this.initJoins();
                        this.listenRedrawEvents();
                }
        }
        randColor() {
                return Math.floor(Math.random()*16777215).toString(16);     
        }
        /*
        listenLines() {
                this.c.addEventListener('mousedown', (e) => {
                        if(this.on) {
                                
                                this.ctx.lineWidth = 2;
                                this.ctx.beginPath();
                                this.ctx.moveTo(e.clientX, e.clientY );
                                this.ctx.lineTo(105, 25);

                                this.ctx.lineTo(45, 125);
                                //this.ctx.closePath();
                                this.ctx.stroke();
                        }
                })
        } */

        initJoins() {
                this.linkPaths = {};
                this.tables.forEach(tbl => {
                        if(tbl.fkJoinColor === undefined) 
                                tbl.fkJoinColor = '#' + this.randColor();

                        this.ctx.strokeStyle = tbl.fkJoinColor;

                        tbl.fkFields.forEach( (fk) => {

                                let destTable = this.tables.find(fk.destTable);
                                if(destTable) {
                                        // shorter path
                                        let shorter = this.getGripShorterPath(tbl, destTable);
                                        // test
                                        let gapFrom = this.gapLinks(shorter[0]);
                                        let gapDest = this.gapLinks(shorter[1]);
                                        //
                                        
                                        this.ctx.lineWidth = 2;
                                        this.ctx.beginPath();

//                                        this.ctx.moveTo(shorter[0].refPos.x, shorter[0].refPos.y);
//                                        this.ctx.lineTo(shorter[1].refPos.x, shorter[1].refPos.y );
                                        if (shorter[0].type === 'top' || shorter[0].type === 'bottom')
                                                this.ctx.moveTo(shorter[0].refPos.x + gapFrom, shorter[0].refPos.y);
                                        else
                                                this.ctx.moveTo(shorter[0].refPos.x, shorter[0].refPos.y + gapFrom);

                                        if (shorter[1].type === 'top' || shorter[1].type === 'bottom')
                                                this.ctx.lineTo(shorter[1].refPos.x + gapDest, shorter[1].refPos.y);
                                        else
                                                this.ctx.lineTo(shorter[1].refPos.x, shorter[1].refPos.y + gapDest);
                                     
                                        this.ctx.stroke();
                                        this.ctx.closePath();
                                }
                        }); 
                       
                });
        }

        gapLinks(grip) {
                // test 
                let gap = 3;
                let index = grip.table.id;
                if (this.linkPaths[index] === undefined) {
                        this.linkPaths[index] = {};
                        this.linkPaths[index][grip.type] = 1;
                } else if (this.linkPaths[index][grip.type] === undefined) {
                        this.linkPaths[index][grip.type] = 1;
                } else {
                        this.linkPaths[index][grip.type]++;
                        let count = this.linkPaths[index][grip.type] -1;
                        if (count >= 0) {
                                if (count % 2 === 0) {
                                        return gap * count;
                                }  else {
                                        return - gap * count;
                                }
                        } 
                }
                return 0;
                
        }

        getGripShorterPath(table, destTable) {
                
                function distance(g, dg) {
                        return Math.sqrt((Math.pow((dg.refPos.x - g.refPos.x),2) + Math.pow((dg.refPos.y - g.refPos.y), 2)));
                }
                let shorterTableGrip = table.grips.top;
                let shorterDestTableGrip = destTable.grips.top;
                let compare = distance(shorterTableGrip, shorterDestTableGrip);

                for (let [k, g] of Object.entries(table.grips)) {
                        for (let [k1, dg] of Object.entries(destTable.grips)) {
                                let dis = distance(g, dg);
                                if (dis < compare) {
                                        compare = dis;
                                        shorterTableGrip = g;
                                        shorterDestTableGrip = dg
                                }
                        } 
                }

                return [shorterTableGrip, shorterDestTableGrip];
        }
        listenRedrawEvents() {
                const me = this;
                this.redraw.addEventListener('redraw', function(e) {
                        if(e.detail === 'clearCanvas')
                                me.clearCanvas();
                        if(e.detail === 'initJoins')
                                me.initJoins();
                });
        }
        clearCanvas() {
                this.ctx.clearRect(0,0,this.width, this.height);
        }
}


window.addEventListener('load', function() {
        uml.listenMenus();
        uml.parseData(db);
        uml.initCanvas();
})