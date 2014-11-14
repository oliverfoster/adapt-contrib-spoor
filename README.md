adapt-contrib-spoor
===================

##Usage instructions
In order to get this to work in adapt_framework, your course will need tracking IDs, the insertion/removal of these can be automated using the <a href="https://github.com/cgkineo/adapt-grunt" target="_blank">tracking-insert:id</a> grunt task suite.

Then, after grunt dev or grunt build has been run, all files from adapt-contrib-spoor/required will be copied into the root of the build folder.

To tracking question component scores and selections, use:  
```
{
    "_spoor": {
        "_tracking": {
            "_extended": true
        }
}

```
  
For testing only - to allow the use of cookies to store suspend data, use:
```
{
    "_spoor": {
        "_tracking": {
            "_extended": true,
            "_fauxLMS": true
        }
    }
}


