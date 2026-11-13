"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("./entities/user.entity");
const role_entity_1 = require("./entities/role.entity");
const user_role_entity_1 = require("./entities/user-role.entity");
const master_entity_entity_1 = require("./entities/master-entity.entity");
const rencana_kunjungan_entity_1 = require("./entities/rencana-kunjungan.entity");
const seeder_service_1 = require("./database/seeder.service");
const auth_module_1 = require("./auth/auth.module");
const rencana_kunjungan_module_1 = require("./rencana-kunjungan/rencana-kunjungan.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST || 'localhost',
                port: Number(process.env.DB_PORT) || 5432,
                username: process.env.DB_USERNAME || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: process.env.DB_NAME || 'visitflow_db',
                entities: [user_entity_1.User, role_entity_1.Role, user_role_entity_1.UserRole, master_entity_entity_1.MasterEntity, rencana_kunjungan_entity_1.RencanaKunjungan],
                synchronize: true,
            }),
            auth_module_1.AuthModule,
            rencana_kunjungan_module_1.RencanaKunjunganModule,
        ],
        providers: [seeder_service_1.SeederService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map