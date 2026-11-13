"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RencanaKunjungan = exports.SegmenKunjungan = exports.StatusKunjungan = void 0;
const typeorm_1 = require("typeorm");
const master_entity_entity_1 = require("./master-entity.entity");
const user_entity_1 = require("./user.entity");
var StatusKunjungan;
(function (StatusKunjungan) {
    StatusKunjungan["VISITED"] = "VISITED";
    StatusKunjungan["NOT_VISITED"] = "NOT-VISITED";
})(StatusKunjungan || (exports.StatusKunjungan = StatusKunjungan = {}));
var SegmenKunjungan;
(function (SegmenKunjungan) {
    SegmenKunjungan["B2B"] = "B2B";
    SegmenKunjungan["B2G"] = "B2G";
})(SegmenKunjungan || (exports.SegmenKunjungan = SegmenKunjungan = {}));
let RencanaKunjungan = class RencanaKunjungan {
};
exports.RencanaKunjungan = RencanaKunjungan;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], RencanaKunjungan.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], RencanaKunjungan.prototype, "entity", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], RencanaKunjungan.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: StatusKunjungan,
        default: StatusKunjungan.NOT_VISITED,
    }),
    __metadata("design:type", String)
], RencanaKunjungan.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: SegmenKunjungan,
    }),
    __metadata("design:type", String)
], RencanaKunjungan.prototype, "segmen", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], RencanaKunjungan.prototype, "tanggal_kunjungan", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => master_entity_entity_1.MasterEntity),
    (0, typeorm_1.JoinColumn)({ name: 'entity' }),
    __metadata("design:type", master_entity_entity_1.MasterEntity)
], RencanaKunjungan.prototype, "masterEntity", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], RencanaKunjungan.prototype, "user", void 0);
exports.RencanaKunjungan = RencanaKunjungan = __decorate([
    (0, typeorm_1.Entity)('rencana_kunjungan')
], RencanaKunjungan);
//# sourceMappingURL=rencana-kunjungan.entity.js.map