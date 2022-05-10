import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { config } from "dotenv";
import * as redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";
// use the old playground lol
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";

import mikroConfig from "./mikro-orm.config";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { COOKIE_NAME, __prod__ } from "./constants";

config();

const initServer = async (orm: MikroORM<PostgreSqlDriver>) => {
  const app = express();
  const corsOptions = {
    origin: [
      "http://localhost:4000",
      "http://localhost:3000",
      "https://studio.apollographql.com",
    ],
    credentials: true,
  };
  app.use(cors(corsOptions));

  const schema = await buildSchema({
    resolvers: [HelloResolver, PostResolver, UserResolver],
    validate: false,
  });

  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient({ legacyMode: true });
  await redisClient.connect();

  // ORDER matters, this session middleware will run before the apollo middleware
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redisClient,
        disableTouch: true,
      }),
      cookie: {
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true, // javascript code cnanot access this cookie
        // secure: __prod__, // cookie only works in https
        // secure: false,
        sameSite: "lax", // should be lax
        secure: false,
      },
      saveUninitialized: false,
      secret: process.env.redis_secret!,
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema,
    csrfPrevention: true,
    context: ({ req, res }) => {
      //   res.header(
      //     "Access-Control-Allow-Origin",
      //     "https://studio.apollographql.com"
      //   );
      //   res.header("Access-Control-Allow-Credentials", "true");
      return { em: orm.em, req, res };
    }, // this context is available to all resolvers
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  });

  // without this, apollo will throw an error.
  await apolloServer.start();

  // create a graphQL endpoint on express
  apolloServer.applyMiddleware({
    app,
    cors: false,
    // path: "/graphql",
  });

  app.get("/", (req, res) => {
    res.send("Hello");
  });
  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
};

const start = async () => {
  // some ts error to fix... (?)
  const orm = await MikroORM.init<PostgreSqlDriver>(mikroConfig);

  // auto run migrations
  await orm.getMigrator().up();

  // .create is old method which will have this error
  /*
    ValidationError: Using global EntityManager instance methods for context specific actions is disallowed.
     If you need to work with the global instance's identity map, use `allowGlobalContext` configuration option or `fork()` instead
  */
  // const post = orm.em.fork({}).create(Post, {
  //   title: "my first post",
  //   id: 1,
  //   createdAt: new Date(),
  //   updatedAt: new Date(),
  // });
  //   await orm.em.persistAndFlush(post);

  //   const posts = await orm.em.find(Post, {});
  //   console.log(posts);
  initServer(orm);
};

start().catch((err) => console.error(err));
