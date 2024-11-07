/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(tabs)` | `/(tabs)/` | `/(tabs)/AudioUpload` | `/(tabs)/CameraScreen` | `/(tabs)/HandleCookMode` | `/(tabs)/RecipeListScreen` | `/(tabs)/RecipeScreen` | `/(tabs)/styles` | `/AudioUpload` | `/CameraScreen` | `/HandleCookMode` | `/RecipeListScreen` | `/RecipeScreen` | `/_sitemap` | `/styles`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
