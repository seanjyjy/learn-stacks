import { EntitySchema } from "@mikro-orm/core";
import {
  AnyEntity,
  EntityClass,
  EntityClassGroup,
} from "@mikro-orm/core/typings";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import path from "path";
import { config } from "dotenv";

config();

type migration = {
  tableName: string;
  path: string;
  glob: string;
  transactional: boolean;
  disableForeignKeys: boolean;
  allOrNothing: boolean;
  dropTables: boolean;
  safe: boolean;
  snapshot: boolean;
  emit: string;
  fileName: (timestamp: string) => string;
};

type configPSQL = {
  dbName: string;
  debug: boolean;
  entities: (
    | string
    | EntityClass<AnyEntity>
    | EntityClassGroup<AnyEntity>
    | EntitySchema<any>
  )[];
  type: "postgresql"; // should be anything but just forcing it be psql!
  user: string;
  password?: string;
  migrations: Partial<migration>;
  allowGlobalContext: boolean;
};

const mikroConfig: configPSQL = {
  entities: [Post, User],
  dbName: "learnstack",
  type: "postgresql",
  user: "postgres",
  password: process.env.password,
  debug: !__prod__,
  migrations: {
    path: path.join(__dirname, "./migrations"),
    glob: "!(*.d).{js,ts}", // how to match migration files (all .js and .ts files, but not .d.ts)
  },
  allowGlobalContext: true,
};

export default mikroConfig;
