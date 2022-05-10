import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";

@ObjectType() // converting this entity to graphQL types. ORDER MATTERS
@Entity()
export class Post {
  // ?: refers to optional properties
  // !: should be refer to non nullable
  @Field(() => Int) // exposes the type graphschema?
  @PrimaryKey()
  id?: number;

  @Field(() => String)
  @Property({ type: "date" })
  createdAt?: Date = new Date();

  // special hook that is to ensure a new date is generated
  @Field(() => String)
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt?: Date = new Date();

  // without this decorator, it is just a field in the class
  // with it, it will be a column in the database
  @Field()
  @Property({ type: "text" })
  title!: string;

  /*
  default values can be set implicity or explicitly
  @Property()
  foo = 1;

  @Property()
  bar = 'abc';
  
  @Property()
  baz = new Date();


  or
  @Property({ default: 1 })
  foo!: number;
  
  @Property({ default: 'abc' })
  bar!: string;
  
  @Property({ defaultRaw: 'now' })
  baz!: Date;
  */
}
