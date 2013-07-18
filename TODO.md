Contributing
===============

  * documentation: convert docs/*txt into *md and verify the content applies to reinhardt
  * read the django commits related to templating: https://github.com/django/django/commits/master/django/template
    * create issue for commits we need to port (with link to original commit in django)
    * actually port them, by:
      * writing the unit tests
      * fixing the code
  * make disabled unit tests work or port new unit tests from django

When porting from Django: do not worry about "future" and backwards compatibility. We will deal with that once we hit 1.0.

Goals
============
 * aims to be functionally equivalent to the current django master
 * not intended to work in a browser environment
 * beta software


Implemented filters and tags
=================================


    | Implemented |     Tag     |
    |      X      | autoescape  |
    |      X      | block       |
    |      X      | comment     |
    |             | csrf_token  |
    |      X      | cycle       |
    |             | debug       |
    |      X      | extends     |
    |      X      | filter      |
    |      X      | firstof     |
    |      X      | for         |
    |      X      | for...empty |
    |      X      | if          |
    |      X      | ifchanged   |
    |      X      | ifequal     |
    |      X      | ifnotequal  |
    |      X      | include     |
    |     NEW     | loadfilter  |
    |     NEW     | loadtag     |
    |     N/A     | load        |
    |             | now         |
    |             | regroup     |
    |      X      | spaceless   |
    |             | ssi         |
    |             | templatetag |
    |     N/A     | url         |
    |      X      | verbatim    |
    |      X      | widthratio  |
    |      X      | with        |

    | Implemented | Filter             |
    |      X      | add                |
    |      X      | addslashes         |
    |     NEW     | byKey              |
    |      X      | capfirst           |
    |      X      | center             |
    |      X      | cut                |
    |      X      | date               |
    |      X      | default            |
    |     N/A     | default_if_none    |
    |     NEW     | defaultifnull
    |     N/A     | dictsort           |
    |     N/A     | dictsort_reversed  |
    |             | divisibleby        |
    |      X      | escape             |
    |             | escapejs           |
    |             | filesizeformat     |
    |      X      | first              |
    |      X      | fix_ampersands     |
    |      X      | floatformat        |
    |             | get_digit          |
    |             | iriencode          |
    |      X      | join               |
    |     NEW     | key                |
    |      X      | last               |
    |      X      | length             |
    |      X      | length_is          |
    |      X      | linebreaks         |
    |      X      | linebreaksbr       |
    |      X      | linenumbers        |
    |      X      | ljust              |
    |      X      | lower              |
    |      X      | make_list          |
    |             | phone2numeric      |
    |             | pluralize          |
    |             | pprint             |
    |             | random             |
    |      X      | removetags         |
    |      X      | rjust              |
    |      X      | safe               |
    |             | safeseq            |
    |      X      | slice              |
    |      X      | slugify            |
    |     NEW     | sortByKey          |
    |      X      | stringformat       |
    |      X      | striptags          |
    |             | time               |
    |             | timesince          |
    |             | timeuntil          |
    |      X      | title              |
    |      X      | truncatechars      |
    |      X      | truncatewords      |
    |      X      | truncatewords_html |
    |             | unordered_list     |
    |      X      | upper              |
    |             | urlencode          |
    |             | urlize             |
    |             | urlizetrunc        |
    |      X      | wordcount          |
    |      X      | wordwrap           |
    |      X      | yesno              |
