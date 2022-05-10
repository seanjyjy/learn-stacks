import React from "react";
import { Form, Formik } from "formik";
import { Box, Button } from "@chakra-ui/react";
import Wrapper from "../components/Wrapper";
import InputField from "../components/InputField";
import { useRegisterMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import { useRouter } from "next/router";
// import { useMutation } from "urql";

// const REGISTER_MUT = `
// mutation Register($username: String!, $password: String!) {
//     register(options: { username: $username, password: $password}) {
//       errors {
//         field
//         message
//       }
//       user {
//         id
//         createdAt
//         updatedAt
//         username
//       }
//   }
// }
// `;

const Reigster = () => {
  // const [, register] = useMutation(REGISTER_MUT);
  const [, register] = useRegisterMutation();
  const router = useRouter();

  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ username: "", password: "" }}
        onSubmit={async (values, { setErrors }) => {
          // it just nice line up nicely but for clarity would prefer to destructure and show
          // register(values);
          const response = await register({
            username: values.username,
            password: values.password,
          });
          if (response.data?.register.errors) {
            setErrors(toErrorMap(response.data.register.errors));
          } else if (response.data?.register.user) {
            // success
            router.push("/");
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="username"
              placeholder="username"
              label="Username"
            />
            <Box mt={4}>
              <InputField
                name="password"
                placeholder="password"
                label="Password"
                type="password"
              />
            </Box>
            <Button mt={4} type="submit" color="teal" isLoading={isSubmitting}>
              register
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default Reigster;
