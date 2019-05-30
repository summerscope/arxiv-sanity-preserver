// various JS utilities shared by all templates

// helper function so that we can access keys in url bar
var QueryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  }
    return query_string;
}();

function jq( myid ) { return myid.replace( /(:|\.|\[|\]|,)/g, "\\$1" ); } // for dealing with ids that have . in them

function build_ocoins_str(p) {
  var ocoins_info = {
    "ctx_ver": "Z39.88-2004",
    "rft_val_fmt": "info:ofi/fmt:kev:mtx:journal",
    "rfr_id": "info:sid/arxiv-sanity.com:arxiv-sanity",

    "rft_id": p.link,
    "rft.atitle": p.title,
    "rft.jtitle": "arXiv:" + p.pid + " [" + p.category.substring(0, p.category.indexOf('.')) + "]",
    "rft.date": p.published_time,
    "rft.artnum": p.pid,
    "rft.genre": "preprint",

    // NB: Stolen from Dublin Core; Zotero understands this even though it's
    // not part of COinS
    "rft.description": p.abstract,
  };
  ocoins_info = $.param(ocoins_info);
  ocoins_info += "&" + $.map(p.authors, function(a) {
      return "rft.au=" + encodeURIComponent(a);
    }).join("&");

  return ocoins_info;
}

function build_authors_html(authors) {
  var res = '';
  for(var i=0,n=authors.length;i<n;i++) {
    var link = '/search?q=' + authors[i].replace(/ /g, "+");
    res += '<a href="' + link + '">' + authors[i] + '</a>';
    if(i<n-1) res += ', ';
  }
  return res;
}

function build_categories_html(tags) {
  var res = '';
  for(var i=0,n=tags.length;i<n;i++) {
    var link = '/search?q=' + tags[i].replace(/ /g, "+");
    res += '<a class="cs" href="' + link + '">' + tags[i] + '</a>';
  }
  return res;
}

function strip_version(pidv) {
  var lst = pidv.split('v');
  return lst[0];
}

// populate papers into #rtable
// we have some global state here, which is gross and we should get rid of later.
var pointer_ix = 0; // points to next paper in line to be added to #rtable
var showed_end_msg = false;
function addPapers(num, dynamic) {
  if(papers.length === 0) { return true; } // nothing to display, and we're done

  var root = d3.select("#rtable");

  var base_ix = pointer_ix;
  for(var i=0;i<num;i++) {
    var ix = base_ix + i;
    if(ix >= papers.length) {
      if(!showed_end_msg) {
        if (ix >= numresults){
          var msg = 'Results complete.';
        } else {
          var msg = 'You hit the limit of number of papers to show in one result.';
        }
        root.append('div').classed('msg', true).html(msg);
        showed_end_msg = true;
      }
      break;
    }
    pointer_ix++;

    var p = papers[ix];
    var div = root.append('article').attr('id', p.pid);

    // Generate OpenURL COinS metadata element -- readable by Zotero, Mendeley, etc.
    var ocoins_span = div.append('span').classed('Z3988', true).attr('title', build_ocoins_str(p));

    var tdiv = div.append('section').classed('paperdesc', true);

    // Save/Remove from library
    var lib_state_img = p.in_library === 1 ? 'remove' : 'add';
    var button_text = p.in_library === 1 ? 'Remove from your library' : 'Save to your library';
    var saveimg = tdiv.append('button').attr('class', lib_state_img)                    
                    .classed('save-icon', true)
                    .attr('type', 'button')
                    .attr('id', 'lib'+p.pid)
                    .append('span').classed('sr-only', true).classed('sr-only-focusable', true).html(button_text);

    // Paper title
    tdiv.append('h2').classed('ts', true).html(p.title);

    // Paper authors
    tdiv.append('p').classed('as', true).html(build_authors_html(p.authors));

    // Paper publish date
    tdiv.append('time').classed('ds', true).html(p.published_time);
    if(p.originally_published_time !== p.published_time) {
      tdiv.append('time').classed('ds2', true).html(' (v1: ' + p.originally_published_time + ')');
    }

    // access PDF of the paper
    var pdf_link = p.link.replace("abs", "pdf"); // convert from /abs/ link to /pdf/ link. url hacking. slightly naughty
    if(pdf_link === p.link) { var pdf_url = pdf_link } // replace failed, lets fall back on arxiv landing page
    else { var pdf_url = pdf_link + '.pdf'; }

    // show raw arxiv id

    tdiv.append('div').classed('links', true)
      .append('a', 'a').attr('href', p.link).attr('target', '_blank').html('Arxiv ' + p.pid)
      .append('a').attr('href', pdf_url).attr('target', '_blank').html('Read the PDF');

    if(p.comment) {
      tdiv.append('p').classed('ccs', true).html(p.comment);
    } 
                    
    // attach a handler for in-library toggle
    saveimg.on('click', function(pid, elt){
      return function() {
        if(username !== '') {
          // issue the post request to the server
          $.post("/libtoggle", {pid: pid})
           .done(function(data){
              // toggle state of the image to reflect the state of the server, as reported by response
              if(data === 'ON') {
                elt.attr('src', 'static/saved.svg');
              } else if(data === 'OFF') {
                elt.attr('src', 'static/plus.svg');
              }
           });
        } else {
          alert('you must be logged in to save papers to library.')
        }
      }
    }(p.pid, saveimg)); // close over the pid and handle to the image
    

    if(typeof p.img !== 'undefined') {
      div.append('figure').classed('animg', true)
        .append('a').attr('href', p.img).attr('target', '_blank')
        .append('img').attr('src', p.img);
    }

    var ftdiv = div.append('nav');
    ftdiv.append('div').classed('cs', true).html(build_categories_html(p.tags));
    // action items for each paper

    // rank by tfidf similarity
    ftdiv.append('div').classed('buttons', true);
    var find_similar = ftdiv.append('button').classed('sim', true).attr('id', 'sim'+p.pid).html('show similar');
    find_similar.on('click', function(pid){ // attach a click handler to redirect for similarity search
      return function() { window.location.replace('/' + pid); }
    }(p.pid)); // closer over the paper id

    // var review_span = ldiv.append('span').classed('sim', true).attr('style', 'margin-left:5px; padding-left: 5px; border-left: 1px solid black;').append('a').attr('href', 'http://www.shortscience.org/paper?bibtexKey='+p.pid).html('review');
    var discuss_text = p.num_discussion === 0 ? 'discuss' : 'discuss [' + p.num_discussion + ']';
    var discuss_color = p.num_discussion === 0 ? 'black' : 'red';
    var review_span = ftdiv.append('button').classed('sim', true)
                           .append('a').attr('href', 'discuss?id='+strip_version(p.pid)).html(discuss_text);

    // in friends tab, list users who the user follows who had these papers in libary
    if(render_format === 'friends') {
      if(pid_to_users.hasOwnProperty(p.rawpid)) {
        var usrtxt = pid_to_users[p.rawpid].join(', ');
        div.append('div').classed('inlibsof', true).html('In libraries of: ' + usrtxt);
      }
    }

    if(typeof p.abstract !== 'undefined') {
      var abdiv = div.append('div').classed('tt', true).html(p.abstract);
      if(dynamic) {
        MathJax.Hub.Queue(["Typeset",MathJax.Hub,abdiv[0]]); //typeset the added paper
      }
    }

    // create the tweets
    if(ix < tweets.length) {
      var ix_tweets = tweets[ix].tweets; // looks a little weird, i know
      var tdiv = div.append('div').classed('twdiv', true);
      var tcontentdiv = div.append('div').classed('twcont', true);
      tdiv.append('div').classed('tweetcount', true).text(tweets[ix].num_tweets + ' tweets:');
      for(var j=0,m=ix_tweets.length;j<m;j++) {
        var t = ix_tweets[j];
        var border_col = t.ok ? '#3c3' : '#fff'; // distinguish non-boring tweets visually making their border green
        var timgdiv = tdiv.append('img').classed('twimg', true).attr('src', t.image_url)
                          .attr('style', 'border: 2px solid ' + border_col + ';');
        var act_fun = function(elt, txt, tname, tid, imgelt){  // mouseover handler: show tweet text.
          return function() {
            elt.attr('style', 'display:block;'); // make visible
            elt.html(''); // clear it
            elt.append('div').append('a').attr('href', 'https://twitter.com/' + tname + '/status/' + tid).attr('target', '_blank')
                                         .attr('style', 'font-weight:bold; color:#05f; text-decoration:none;').text('@' + tname + ':'); // show tweet source
            elt.append('div').text(txt) // show tweet text
            imgelt.attr('style', 'border: 2px solid #05f;'); 
          }
        }(tcontentdiv, t.text, t.screen_name, t.id, timgdiv)
        timgdiv.on('mouseover', act_fun);
        timgdiv.on('click', act_fun);
        timgdiv.on('mouseout', function(elt, col){
          return function() { elt.attr('style', 'border: 2px solid ' + col + ';'); }
        }(timgdiv, border_col));
      }
    }

    if(render_format == 'paper' && ix === 0) {
      // lets insert a divider/message
      root.append('div').classed('paperdivider', true).html('Most similar papers:');
    }
  }

  return pointer_ix >= papers.length; // are we done?
}

function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate().toString();
  var hour = a.getHours().toString();
  var min = a.getMinutes().toString();
  var sec = a.getSeconds().toString();
  if(hour.length === 1) { hour = '0' + hour; }
  if(min.length === 1) { min = '0' + min; }
  if(sec.length === 1) { sec = '0' + sec; }
  var time = date + ' ' + month + ' ' + year + ', ' + hour + ':' + min + ':' + sec ;
  return time;
}
