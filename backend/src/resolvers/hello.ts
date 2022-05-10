import { Query, Resolver } from "type-graphql";

@Resolver()
export class HelloResolver {
  /*
   All in all this will probably return to us a json object which is 

    {
        "data": {
            "hello": "hello world"
        }
    }
   
   */

  /*
    The query for this can be simplied into just since its just string

    {
      hello
    }
  */

  @Query(() => String)
  // this is probably the property name in json
  hello() {
    // this is the response
    return "hello world";
  }
}
