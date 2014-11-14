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
```

###Limitations
```
_extended: false
```
This setting is the default serializer. It tracks only block completion and reinstates sub component _isComplete states.  
  
```
_extended:true
```
This setting is the extended serializer. It tracks block completion as per the default above. But also stores question component _score variables and (new) _selectionData variables. (A question component is any component which extends the questionView or, more simply, has _isQuestionType: true variable).  
    
Component _selectionData variable:  
  
This variable must be an array of booleans on the component model, with a maximum length of 28. It is the components responsibility to create the _selectionData variable before completion and to reinstate the item selections from the _selectionData upon instanciation.  

Component _score variable:  
  
This can be the stantard question component score. It is saved to the LMS as a value from 0-255 whereby a component score of 1 is saved to the LMS as a value of 100, a score of .2 is saved as a value of 20 and 2.55 is saved as a value of 255.  
  
When using this extended storage mechanism it is imporatant to keep block tracking id's consistent and component placement inside blocks consistant and b-01[tracking id: 1] { c-01, c-02 } would be saved as tracking id, index 1 and index 2. Question component items must remain in their initial JSON order to preserve the relationship between user selection and storage, but their content can be change and items can be appended or removed from the end of the list. i.e. [item1(selected), item2, item3, item4(selected)] would be saved to the LMS as [true,false,false,true].  
