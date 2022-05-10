import { User } from "../entities/User";
import { MyContext } from "../types";
import {
  Resolver,
  InputType,
  Field,
  Arg,
  Ctx,
  Mutation,
  ObjectType,
  Query,
} from "type-graphql";
import argon2 from "argon2";
import { EntityManager } from "@mikro-orm/postgresql";
import { COOKIE_NAME } from "../constants";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;

  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

function fieldError(field: string, message: string): { errors: FieldError[] } {
  return {
    errors: [
      {
        field,
        message,
      },
    ],
  };
}

@Resolver()
export class UserResolver {
  /*
  mutation {
    register(options: { username: "admin", password: "admin"}) {
      errors {
        field
        message
      }
      user {
        id
        createdAt
        updatedAt
        username
      }
  }
}

  */

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return fieldError("username", "length must be greater than 2");
    }

    if (options.password.length <= 3) {
      return fieldError("password", "length must be greater than 3");
    }

    const hashedPassword = await argon2.hash(options.password);
    // const user = em.create(User, {
    //   username: options.username,
    //   password: hashedPassword,
    // });
    let user;
    try {
      // await em.persistAndFlush(user);

      // example of query builder
      const [result] = await (em as EntityManager)
        .createQueryBuilder(User)
        .getKnexQuery()
        .insert({
          username: options.username,
          password: hashedPassword,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning("*");
      user = result[0];
    } catch (err) {
      if (err.code === "23505") {
        return fieldError("username", "username already taken");
      }
    }

    return { user };
  }

  /*
  executing this mutation
    mutation {
    login(options: {
      username: "admin", password: "admin"}) {
          errors {
              field
              message
          }
          user {
              id
              username
              updatedAt
              createdAt
          }
      }
  }
  will give us a structure of 
  {
    "data": {
      "login": {
        "errors": null,
        "user": {
          "id": 1,
          "username": "sean",
          "updatedAt": "1652119932000",
          "createdAt": "1652119932000"
        }
      }
    }
  }


  while executing
  mutation {
      login(options: {
          username: "sean", password: "s4an"}) {
              errors {
                  field
                  message
              }
              user {
                  id
                  username
              }
          }
      }
  }

  will give us
  {
    "data": {
      "login": {
        "errors": [
          {
            "field": "password",
            "message": "incorrect password"
          }
        ],
        "user": null
      }
    }
  }

  and an incorrect username will be catch first
  mutation {
    login(options: {
        username: "s4an", password: "s4an"}) {
            errors {
                field
                message
            }
            user {
                id
                username
            }
        }
    }
  }

  return us
  {
    "data": {
      "login": {
        "errors": [
          {
            "field": "username",
            "message": "that username doesn't exist"
          }
        ],
        "user": null
      }
    }
  }
  */
  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username });

    if (!user) {
      return fieldError("username", "that username doesn't exist");
    }

    const valid = await argon2.verify(user.password, options.password);

    if (!valid) {
      return fieldError("password", "incorrect password");
    }

    if (req.session && user.id) {
      req.session.userId = user.id;
    }

    return { user };
  }

  /*
{
  me {
    id
    username
  }
}


  */
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, em }: MyContext) {
    if (!req.session.userId) {
      return null;
    }

    const user = await em.findOne(User, { id: req.session.userId });
    return user;
  }

  /*
    mutation {
      logout
    }
  */
  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          resolve(false);
          return;
        }

        resolve(true);
      })
    );
  }
}
