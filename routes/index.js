var express = require('express');
var router = express.Router();

var mysql      = require('mysql');

var connection = mysql.createConnection({
  host     : '127.0.0.1',
  user     : 'root',
  password : 'googlemom',
  database : 'ccms'
});

connection.connect();

function filter(arr, criteria) {
  return arr.filter(function(obj) {
    return Object.keys(criteria).every(function(c) {
      return obj[c] == criteria[c];
    });
  });
}

var groupBy = function(xs, key) {
  return xs.reduce(function(rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

/* GET home page. */
router.get('/', function(req, res, next) {
  if(!req.session.username)
  {
    res.render('index', { title: 'Express',layout: 'layout' });
  }
  else
  {
    dept= req.session.dept;
    var condition;
    if(dept==0)
    {
      condition="1";
      permissions=false;
    }
    else {
      condition ="dept="+dept;
      permissions=true;
    }

    connection.query('select complaints.*,users.name as username,depts.name as deptname from complaints,users,depts where complaints.user=users.id and complaints.dept=depts.id',function(err,results,fields){
      if(err) throw err;
      // results.forEach(function(key) { // forEach iterates through an array
      //   all[key] = (all[key] || 0) + 1; // create new item if it doesn't exist
      // });
      for (var i = 0; i < results.length; i++) {

        dt=new Date(results[i].time)
        m=dt.getMonth();
        d=dt.getDate();
        y=dt.getYear();
        h=dt.getHours();
        mn=dt.getMinutes();
        results[i].time=d+"/"+m+"/"+y+" "+h+":"+mn;
      }

      all_complaints=results;
      id=req.session.userid;
      my_complaints=filter(results,{user:id});
      permissions=false;
      dept_complaints=[];
      if(dept>1)
      {
        dept_complaints=filter(results,{department:dept});
        permissions=true;
      }
      connection.query("select * from depts where name!='None'",function(error,results,fields){
        if(error) throw error;
        depts=results;
        depts_names=[];
        count_arr=[];
        stats=groupBy(JSON.parse(JSON.stringify(all_complaints)),"deptname");
        console.log(stats);
        for(var i=0;i<depts.length;i++)
        {
          depts_names[i]=depts[i].name;
          dm=depts[i].name;
          console.log(depts[i].name);
          console.log(dm);
          console.log(stats[dm]);
          console.log(depts[i].name);
          if(!stats[dm])
          {
            console.log(depts[i].name+"\t"+0);
            count_arr[i]=0;
          }
          else
          {
            console.log(depts[i].name+"\t"+stats[dm].length);
            count_arr[i]=stats[dm].length;
          }

        }
        count_stats="['" +count_arr.join("','") + "']";
        depts_stats="['" +depts_names.join("','") + "']";
        console.log(count_stats);
        console.log(depts_stats);
        //["Africa", "Asia", "Europe", "Latin America", "North America"]
        res.render('home', { title: 'Express',layout: 'layout', permissions:permissions,all_complaints:all_complaints,my_complaints:my_complaints,dept_complaints:dept_complaints,depts:depts,dstats:depts_names,cstats:count_arr});
      });

    });
  }

});



router.get('/logout',function(req,res){
  req.session.destroy(function(err) {
    if(err) {
      console.log(err);
    } else {
      res.redirect('/');
    }
  });
});

router.get('/login', function(req, res, next) {
  if(req.session.username)
    res.redirect('/');
  connection.query("select * from depts where 1",function(error,results,fields){
    if(error) throw error;
    depts=results;
    res.render('login', { title: 'Express',layout: 'layout',depts:depts });
  });
});

router.post('/login', function(req, res, next) {
  if(req.session.username)
    res.redirect('/');

  username=req.body.username;
  password=req.body.password;
  connection.query('SELECT * from users where name="'+username+'" and password="'+password+'"', function (error, results, fields) {
    if (error) throw error;
    if(results.length){
      console.log('The solution is: ', results[0].id);
      req.session.username=username;
      req.session.userid=results[0].id;
      req.session.dept=results[0].department;
      res.redirect("/");
    }
    else {
      res.render('login', { title: 'Express',layout: 'layout', error:'Unable to login!' });
    }

  });
});


router.post('/signup', function(req, res, next) {
  if(req.session.username)
    res.redirect('/');

  username=req.body.username;
  password=req.body.password;
  dept=req.body.dept;
  connection.query('insert into users(name,password,department) values("'+username+'","'+password+'","'+dept+'")', function (error, results, fields) {
    if (error) {
      console.log(error);
      res.render('login', { title: 'Express',layout: 'layout', error:'Please try again to signup!' });
    }
    else{
      //console.log('The solution is: ', results[0].username);
      req.session.username=username;
      req.session.userid=results.insertId;
      req.session.dept=dept;
      res.redirect("/");
    }
  });
});



router.post('/complain', function(req, res, next) {
  if(!req.session.userid)
    res.redirect('/');

  info=req.body.info;
  user=req.session.userid;
  dept=req.body.dept;
  status=0;
  //time=Math.floor(new Date());
  connection.query('insert into complaints(dept,status,time,info,user) values("'+dept+'","'+status+'",NOW(),"'+info+'","'+user+'")', function (error, results, fields) {
    if (error) {
      console.log(error);
      res.render('home', { title: 'Express',layout: 'layout', error:'Unable to complain! Please try again.' });
    }
    else{
      res.redirect("/");
    }
  });
});

module.exports = router;
