import fs from "fs";
import path from "path";
import Http from "http";
import { ApolloServer } from "apollo-server-express";
import { graphqlUploadExpress } from "graphql-upload";
import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge";
import { loadFilesSync } from "@graphql-tools/load-files";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { Express } from "express";
import process from "process";
import { GraphQLSchema } from "graphql";
import "./interfaces/graphiConfig";

const getContext = () => {
  globalThis.logger.warn(`Graph polices loaded, enabled `);
  const policesFile = path.resolve(
    path.join(
      process.env.PWD || "",
      process.env.ROOTDIR || "",
      "/lib/config/polices.ts"
    )
  );
  if (fs.existsSync(policesFile)) {
    let police = require(policesFile).default;
    return police;
  } else {
    globalThis.logger.warn(
      `Graphql polices are disabled, a police file does not exist, api is open for everyone`
    );
    return null;
  }
};

const getResolvers = (graphDirectory: string) => {
  const resolverDirectory = path.join(graphDirectory, "/resolvers");
  const resolversArray = loadFilesSync(resolverDirectory);
  return mergeResolvers(resolversArray);
};

const getTypes = (graphDirectory: string) => {
  //path to files and merge
  const typesDirectory = path.join(graphDirectory, "/types/graphs");
  const typesArray = loadFilesSync(typesDirectory, { recursive: true });
  return mergeTypeDefs(typesArray);
};

const setApolloServer = (schema: GraphQLSchema) => {
  globalThis.logger.warn("Graph resolvers loaded");
  const apollo = new ApolloServer({
    schema,
    debug: false,
    introspection: process.env.ENV === "production" ? false : true,
    playground: process.env.ENV === "production" ? false : true,
    context: getContext(),
    subscriptions: {
      keepAlive: 3,
      onDisconnect: async (_ws, _context) => {
        globalThis.logger.info("client disconected");
      },
    },
  });

  return apollo;
};

export default async (
  app: Express,
  server: Http.Server,
  config: GraphiConfig
) => {
  if (config.graphql) {
    try {
      const graphDirectory = path.join(
        process.env.PWD || "",
        process.env.ROOTDIR || "",
        "/api/graphql"
      );
      const resolvers = getResolvers(graphDirectory);
      const typeDefs = getTypes(graphDirectory);

      const schema = makeExecutableSchema({
        typeDefs,
        resolvers,
      });
      if (fs.existsSync(graphDirectory)) {
        //set apollo server
        const apollo = setApolloServer(schema);
        //apollo middleware
        apollo.applyMiddleware({ app, path: `/${process.env.ENDPOINT}` });
        // apollo suscriptions middleware
        apollo.installSubscriptionHandlers(server);
        //graphql upload middleware
        app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 1 }));
      } else {
        globalThis.logger.warn(
          `Graphql module no initialized, no scheme was found`
        );
      }
    } catch (error) {
      globalThis.logger.error(error);
    }
  }
};
