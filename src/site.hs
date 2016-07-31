{-# LANGUAGE OverloadedStrings #-}
module Main (main) where

import Hakyll

config :: Configuration
config =
  defaultConfiguration{
    deployCommand = "git splat"
  }

main :: IO ()
main = hakyllWith config $ do
  match "content/*.markdown" $ do
    route $ composeRoutes
      (gsubRoute "content/" (const ""))
      (setExtension "html")
    compile pandocCompiler
