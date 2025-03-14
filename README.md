heroku logs --tail --app poulin
heroku restart -a poulin
heroku run bash -a poulin
heroku pg:psql HEROKU_POSTGRESQL_AMBER_URL -a poulin

TODO**\_\_\_**

1. mi piacerebbe che funzionasse prima di tutto
   2)che il FE abbia un layour piu' bello
2. che il backend abbiamo un design patterns migliore
   $) voglio vedere l'historial
3. togli poulin
4. togli daily milk
