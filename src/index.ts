import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";

import mikroConfig from "./mikro-orm.config";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

const initServer = async (orm: MikroORM<PostgreSqlDriver>) => {
  const app = express();

  const schema = await buildSchema({
    resolvers: [HelloResolver, PostResolver, UserResolver],
    validate: false,
  });

  const apolloServer = new ApolloServer({
    schema,
    csrfPrevention: true,
    context: () => ({ em: orm.em }), // this context is available to all resolvers
  });

  // without this, apollo will throw an error.
  await apolloServer.start();

  // create a graphQL endpoint on express
  apolloServer.applyMiddleware({ app });

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
