{-# LANGUAGE OverloadedStrings #-}
module Main (main) where

import Hakyll

config :: Configuration
config = defaultConfiguration

deContentAnd :: Routes -> Routes
deContentAnd = composeRoutes (gsubRoute "content/" (const ""))

main :: IO ()
main = hakyllWith config $ do
  match "content/*.template" $ compile templateCompiler

  match "content/css/*.css" $ do
    route $ deContentAnd idRoute
    compile copyFileCompiler

  match "content/**.markdown" $ do
    route $ deContentAnd (setExtension "html")
    compile $
      pandocCompiler
      >>= loadAndApplyTemplate "content/default.template" defaultContext
      >>= relativizeUrls
