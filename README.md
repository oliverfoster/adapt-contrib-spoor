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
  
When using this extended storage mechanism it is imporatant to keep block tracking id's consistent and component placement inside blocks consistant, such that b-01[tracking id: 1]{ c-01, c-02 } would be saved as tracking-id[index1,index2]. Question component items must remain in their initial JSON order to preserve the relationship between user selection and storage. Question component item contents can be changed and items can be appended only or removed only from the end of the list without adverse effect to the course i.e. [item1(selected), item2, item3, item4(selected)] would be saved to the LMS as [true,false,false,true].  
  
Working specification:  
  
On the premise that 1 hex byte is 4 binary bits or 0-15 as a decimal. i.e. 0-f = 0000-1111 = 0-15   
  
The suspend data is saved to the LMS as a hex encoded string of binary switches, whereby a non-question-type component, or an incomplete question-type component occupies 1 byte(1 hex character) "0000" and a complete questiontype component will store a minimum of 3 bytes (3 hex characters) "1000|0000|0000".  
The bits of each entry are representative of the following:  
  
bit 0: 1 bit : _isComplete : 0/1  
bit 1-3: 3 bits : the number of blocks required to store _selectionData array (where 1 block is half a byte "0000") : 100 = 1 block, 010 = 2 blocks, 111 = 7 blocks (giving 4*7=28 selections)  
bit 4-11: 8 bits : _score : to store the component's Math.round(score*100)  
bit 12+: 4 bit blocks : _selectionData : representing the _selectionData array "1001" for four items where the first and last are selected  
  
Example:  
  
1010|1111|1111|1110|0110  
  
This describes a question-type component which is completed, has a score of 255, has between 7 and 8 items where the first three are selected, the next two are unselected, the following two are selected and the last may or maynot exist but is unselected.  
