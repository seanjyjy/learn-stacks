import { Post } from "../entities/Post";
import { Resolver, Query, Ctx, Arg, Int, Mutation } from "type-graphql";
import { MyContext } from "../types";

// @query is for getting data, @mutation is for create, updating etc

@Resolver()
export class PostResolver {
  /*
    Since this is an object, the post cannot be simplied you have to be explicit

    {
        posts {
            id
            createdAt
            updatedAt
            title
        }
    }

  */

  // this will return an array of post
  @Query(() => [Post])
  posts(@Ctx() { em }: MyContext): Promise<Post[]> {
    return em.find(Post, {});
  }

  /*
  Example Query:
  {
    post(id: 1) {
      title
    }
  }

  on the other hand this will return us null since we dont have id 999 in db

    {
        post(id: 999) {
            title
        }
    }

  */
  @Query(() => Post, { nullable: true })
  post(
    @Arg("id", () => Int) id: number, // the "id" is just name of params when you need to do the query.
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    // we are filtering by id, the 2nd argument is the where clause
    return em.findOne(Post, { id });
  }

  /*
    In comparison to query, you have to start the query with mutation

    mutation {
        createPost(title: "post from grpahql") {
            id
            createdAt
            updatedAt
            title
        }
    }

  */
  @Mutation(() => Post)
  async createPost(
    @Arg("title", () => String) title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post> {
    const post = em.create(Post, { title });
    console.log(post);
    await em.persistAndFlush(post);
    return post;
  }

  /*
  mutation {
      deletePost(id: 1) 
  }

  */
  @Mutation(() => Boolean)
  async deletePost(
    @Arg("id") id: number,
    @Ctx() { em }: MyContext
  ): Promise<boolean> {
    try {
      await em.nativeDelete(Post, { id });
      return true;
    } catch {
      return false;
    }
  }
}
