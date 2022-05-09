import { User } from "../entities/User";
import { MyContext } from "src/types";
import { Resolver, InputType, Field, Arg, Ctx, Mutation } from "type-graphql";
import argon2 from "argon2";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;

  @Field()
  password: string;
}

@Resolver()
export class UserResolver {
  /*
    mutation {
        register(options: { username: "sean", password: "sean" }) {
            id
            createdAt
            updatedAt
            username
            // note that password cannot be get since password is not a field
        }
    }

  */

  @Mutation(() => User)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ) {
    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
    });
    await em.persistAndFlush(user);
    return user;
  }
}
