$(document).ready(function () {

  // инициализирую новую версию jstree
  $('.js2tree').js2tree();

  /**
   * Точки входа:
   * На странице 4 блока инициирующие действия с данными дерева
   * 1. Родительские select2 (например - информационные системы)
   *    Вызываемая функция:   $('[data-jstree-reload]').on('change' ...
   *    далее через callback - jstree().on('redraw.jstree' ...
   *
   * 2. Собственно дерево элементов. Действия и функции:
   *    2.0  инициализация     jstree().on('ready.jstree' ...
   *    2.1  выбор элемента    jstree().on('select_node.jstree' ...
   *      -> через trigger загрузки всех дочерних элементов     jstree().on('load_all.jstree' ...
   *    2.2  снятие выбора     jstree().on('deselect_node.jstree' ...
   *
   * 3. Карточки справа
   *    3.1  убрать            $(document).on('click', '.jstree_plugin_card_close' ...
   *    3.2  восстановить      $(document).on('click', '.jstree_plugin_card_restore' ...
   *
   *  4. Кнопки под блоком
   *    кнопка "Сбросить изменения" -  $('.jstree_btn_reset').click( ...
   *
   *
   *  Данные в модуле
   *  1. Переменные в JS
   *    - jstree_origin_ids   - исходные выбранные атрибуте (копия как в базе, не меняем)
   *    - jstree_current_ids  - выбранные на данный момент пользователем
   *
   *  2. В объекте дерева
   *    $('#jstree-block').jstree(true).get_selected() - меняется при обновлении дерева, иногда поведение не очевидно
   *
   *  3. Набор карточек в правом блоке
   *    - $('ul.jstree_container_cards li.jstree_template_card')  - новые карточки
   *    - $('ul.jstree_container_cards li.jstree_card')           - исходные карточки
   *    - $('ul.jstree_container_cards li.list-group-item')       - все карточки
   *
   *  4. Данные, отдаваемые на сервер при сохранении (для каждого атрибута свой инпут)
   *    $(`div#${leaf_id}`)  или  $(`div#jstree_leaf_id_${id}`)
   *
   *  5. По уровневая подгрузка (lazy_load)
   *    - $('#jstree-block').data('lazy-load-url') - адрес endpoint для ajax запроса
   *    - $('#jstree-block').data('lazy-load-parameters') - массив параметров id-шников для выбора коллекции загружаемых элементов в дереве
   *          = load - элементы, которые нужно загрузить от корневого элемента (принуждает загрузить)
   *          = allowed - разрешенные элементы, за этот список нельзя выходить (накладывает ограничения)
   *          = selected - элементы, которые должны быть выбраны после загрузки дерева
   */

  // 1. инициализация дерева и селекторов
  // current - текущее состояние выбранных id-шников (эквивалент для back)
  // origin  - исходно выбранные id-шники при загрузке страницы (эквивалент для back)
  let jstree_current_ids = gon.jstree_selected_ids
  let jstree_origin_ids = gon.jstree_selected_ids

  $('[data-jstree-reload]').on('change', function(){
    if ($('#jstree-block').length) {
      $('#jstree-block').jstree().deselect_all();
      $('#jstree-block').jstree(true).settings.core.data = jstree_data();

      $('#jstree-block').one('redraw.jstree', function () {
        let selected_ids = jstree_selected_origin_ids();
        $(selected_ids).get().forEach(jstree_element_on);

        jstree_assign_multiple_input_val(selected_ids);
        jstree_multiversion_controll();
      });
      setTimeout(function () {
        $('#jstree-block').jstree(true).refresh();
        }, 1);
      // далее через callback - jstree().on('redraw.jstree' ...
    }
  });

  function jstree_data() {
    if ($('#jstree-block').length === 0) {
      return;
    }

    if ($('#jstree-block').data('lazy-load-url')) {
      return {
        url: $('#jstree-block').data('lazy-load-url'),
        type: 'GET',
        dataType: 'json',
        contentType: 'application/json',
        success: function(ops) {
          setTimeout(function () {
            let selected_ids = jstree_selected_origin_ids();
            selected_ids = $.unique(selected_ids);

            jstree_assign_multiple_input_val(selected_ids);
            jstree_multiversion_controll();
          }, 50);
        },
        data: function(node) {
          let params = {}
          params['parent_id'] = node.id ==="#" ? 0 : node.id

          // depricate
          if ($('#jstree-block').data('lazy-load-param') && (typeof $('#jstree-block').data('lazy-load-param') == 'string')) {
            let param_name = $('#jstree-block').data('lazy-load-param');
            let param_value = $(`[data-parameter-name="${param_name}"]`).select2().val()
            if (param_value.length === 0) {
              param_value = 0
            }
            params[param_name] = param_value;
          }

          let _opts = jstree_load_parameters('lazy-load-parameters');
          if (_opts) {
            params['jstree_opts'] = _opts;
          }

          let _args = jstree_load_parameters('lazy-load-args');
          if (_args) {
            params['jstree_args'] = _args;
          }

          if ($('#jstree-block').data('lazy-load-opts')) {
            let opts = $('#jstree-block').data('lazy-load-opts');
            params = $.extend({}, opts, params);
          }

          return params
        }
      }
    }
    else {
      return gon.jstree_data;
    }
  }

  function jstree_load_parameters (data_field = 'lazy-load-parameters', opts = null, level = 0) {
    if (typeof $('#jstree-block').data(data_field) == 'undefined') {
      return null;
    }

    if (typeof opts == 'undefined' || opts == null) {
      opts = $('#jstree-block').data(data_field);
    }

    if (typeof opts == 'object') {
      if ($.isArray(opts) || (opts.hasOwnProperty('arg_type') && opts.arg_type === 'value')) {
        return opts;
      }

      let tree_load_params = {}
      $.each(opts, function (key, val) {
        tree_load_params[key] = jstree_load_parameters(data_field, val, level + 1)
      });
      return tree_load_params;
    }

    if (typeof opts == 'string') {
      // в дальнейшем может варьироваться вариант селектора, например прежний формат - let element_selector =`[data-parameter-name="${opts}"]`;
      let element_selector = opts;
      // в дальнейшем может быть не только select, а в зависимости от тега элемента
      let param_value = null
      if ( $(element_selector).length > 0 ) {
        if ( ($(element_selector)[0].type == 'checkbox' ) ) {
          param_value = $(element_selector)[0].checked
        } else {
          // select by default
          param_value = $(element_selector).select2().val()
        }
      }

      if ((typeof param_value == 'undefined') || ($.isArray(param_value) && param_value.length == 0)) {
        param_value = 0
      }
      return param_value;
    }
  }

  $('#jstree-block').jstree({
    core: {
      data: jstree_data()
    },
    plugins: [
      'types',
      'search',
      'checkbox'
    ],
    search: {
        'show_only_matches': true,
        'show_only_matches_children': true
    },
    types: {
      default: {icon: 'fas fa-synagogue'},
      attr_npa: {icon: 'fas fa-book'},
      attr_gir: {icon: 'ion ion-ios-keypad text-primary'},
      attr_is: {icon: 'ion ion-md-browsers text-info'},
      attr_dk: {icon: 'fas fa-cube text-info'},
      attr_group: {icon: 'fas fa-cube text-info'},
      attr_key: {icon: 'fas fa-key text-warning'},
      attr_uniq: {icon: false},
      attr_index: {icon: 'fas fa-fingerprint text-warning'},
      attr_collection: {icon: 'far fa-dot-circle text-primary'},
      attr_single: {icon: 'far fa-dot-circle text-success'},
      attr_common: {icon: false},
      attr_warning: {icon: 'ion ion-md-git-commit text-danger'},
      attr_data_mart: { icon: 'ion-logo-buffer text-danger' },
      attr_table: { icon: 'fas fa-table text-primary' },
      attr_attribute: { icon: 'far fa-dot-circle text-success' },
      attr_attribute_unique: { icon: false }
    },
    tools: {
      selected_origin_ids() {
        let origin_ids = $('#jstree-block').jstree('get_selected', true)
            .filter(node => ( $('#jstree-block').data('select-type') !== 'element' ) || (node.children.length <= 0))
            .map(node => node.li_attr.original_id || node.id)
            .map(Number).filter(Number).sort((a, b) => a - b);
        return $.unique( origin_ids );
      },
      selected_data_mart_ids() {
        let origin_ids = $('#jstree-block').jstree(true).settings.tools.selected_origin_ids()
        let data_mart_ids = origin_ids.map(
            node => $("#jstree-block").jstree().get_node(node).data.data_mart_id
        ).map(Number).sort((a, b) => a - b)
        return $.unique( data_mart_ids );
      },
      selected_data_mart_version_ids() {
        let origin_ids = $('#jstree-block').jstree(true).settings.tools.selected_origin_ids()
        let data_mart_version_ids = origin_ids.map(
            node => $("#jstree-block").jstree().get_node(node).data.data_mart_version_id
        ).map(Number).sort((a, b) => a - b)
        return $.unique( data_mart_version_ids );
      },
      selected_data_mart_table_ids() {
        let origin_ids = $('#jstree-block').jstree(true).settings.tools.selected_origin_ids()
        let data_mart_table_ids = origin_ids.map(
            node => $("#jstree-block").jstree().get_node(node).data.data_mart_table_id
        ).map(Number).sort((a, b) => a - b)
        return $.unique( data_mart_table_ids );
      },
      selected_data_mart_table_guids() {
        let origin_ids = $('#jstree-block').jstree(true).settings.tools.selected_origin_ids()
        let data_mart_table_ids = origin_ids.map(
            node => $("#jstree-block").jstree().get_node(node).data.data_mart_table_guid
        )
        return $.unique( data_mart_table_ids );
      },
      selected_data_attribute_guids() {
        let origin_ids = $('#jstree-block').jstree('get_selected', true)
            .filter(node => ( node.data.kind == 'attribute' && node.children.length <= 0))
            .map(node => node.data.guid)
        return $.unique( origin_ids );
      },
      selected_data_mart_version_guids() {
        let origin_ids = $('#jstree-block').jstree(true).settings.tools.selected_origin_ids()
        let data_mart_version_ids = origin_ids.map(
            node => $("#jstree-block").jstree().get_node(node).data.data_mart_version_guid
        )
        return $.unique( data_mart_version_ids );
      },
      selected_data_attributes() {
        let origins = $('#jstree-block').jstree('get_selected', true)
            .filter(node => ( node.data.kind == 'attribute' && node.children.length <= 0))
        return $.unique( origins );
      },
      selected_attributes_fields_as_options() {
        let origin_options = $('#jstree-block').jstree('get_selected', true)
            .filter(node => ( node.data.kind == 'attribute' && node.children.length <= 0))
            .map(
                node =>`<option value="${node.data.table_label}.${node.data.tech_name}" data-table="${node.data.table_label}" data-attribute="${node.data.tech_name}">${node.data.name} (${node.data.tech_name})</option>`
            );
        return $.unique( origin_options );
      },
      trigger_change_ids() {
        if ($('.regulated_query_common_form [data-name="data_mart_version"]').length > 0) {
          $('.regulated_query_common_form [data-name="data_mart_version"]').trigger('click');
        }

        $('#jstree-block').jstree(true).settings.tools.single_data_mart_version()
      },
      single_data_mart_version() {
        if ($('#jstree-block').data('settings-single') != 'data_mart_version') {
          return true;
        }

        let _data_mart_version_guid = $('#jstree-block').jstree(true).settings.tools.selected_data_mart_version_guids();
        if (_data_mart_version_guid.length > 0) {
          $('#jstree-block').jstree('get_json', null, { 'flat': true })
              .filter(node => ( node.data.kind == 'data_mart_version' && !_data_mart_version_guid.includes(node.data.guid) ||
                  (node.data.kind == 'table' || node.data.kind == 'attribute') && !_data_mart_version_guid.includes(node.data.data_mart_version_guid) ))
              .forEach(function(e) {
                $('#jstree-block').jstree(true).disable_node(e.id);
              })
        } else {
          $('#jstree-block').jstree('get_json', null, { 'flat': true })
              .filter(node => ( node.data.kind == 'data_mart_version' || node.data.kind == 'table' || node.data.kind == 'attribute'))
              .forEach(function(obj) {
                $('#jstree-block').jstree(true).enable_node(obj.id);
              })
        }
      },
      set_single_attribute() {
        $('#jstree-block').data('settings-single', 'attribute')
        $('#jstree-block').jstree(true).settings.tools.single_attribute();
      },
      set_single_table() {
        $('#jstree-block').data('settings-single', 'table')
        $('#jstree-block').jstree(true).settings.tools.single_table();
      },
      single_attribute() {
        if ($('#jstree-block').data('settings-single') != 'attribute') {
          return true;
        }

        $('#jstree-block').jstree('get_json', null, { 'flat': true })
            .filter(node => ( node.data.kind == 'table'))
            .forEach(function(e) {$('#jstree-block').jstree(true).disable_node(e.id)})

        let _attr_guid = $('#jstree-block').jstree(true).settings.tools.selected_data_attribute_guids();
        if (_attr_guid.length > 1) {
          $('#jstree-block').jstree().deselect_all();
          $('#jstree-block').jstree(true).settings.tools.trigger_change_ids();
          return;
        }

        $('#jstree-block').jstree('get_json', null, { 'flat': true }).filter(node => (node.data.kind == 'attribute'))
            .forEach(function(e) {
              if (_attr_guid.length == 0 || _attr_guid.includes(e.data.guid)) {
                $('#jstree-block').jstree(true).enable_node(e.id);
              } else {
                $('#jstree-block').jstree(true).disable_node(e.id);
              }
            })
      },
      single_table() {
        if ($('#jstree-block').data('settings-single') != 'table') {
          return true;
        }

        let _table_guid = $('#jstree-block').jstree(true).settings.tools.selected_data_mart_table_guids();
        if (_table_guid.length > 1) {
          $('#jstree-block').jstree().deselect_all();
          $('#jstree-block').jstree(true).settings.tools.trigger_change_ids();
          return;
        }

        $('#jstree-block').jstree('get_json', null, { 'flat': true }).filter(node => (['table', 'attribute'].includes(node.data.kind) ))
            .forEach(function(obj) {
              if (_table_guid.length == 0 || _table_guid.includes(obj.data.guid) || _table_guid.includes(obj.data.data_mart_table_guid)) {
                $('#jstree-block').jstree(true).enable_node(obj.id);
              } else {
                $('#jstree-block').jstree(true).disable_node(obj.id);
              }
            })
      },
      selected_attributes_tech_name() {
        let origin_ids = $('#jstree-block').jstree('get_selected', true)
            .filter(node => ( node.data.kind == 'attribute' && node.children.length <= 0))
            .map(node => `${node.data.tech_name}`);
        return $.unique( origin_ids );
      },
      same_data_mart_not_selected_tables_as_options() {
        let selected_tables = $('#jstree-block').jstree(true).settings.tools.selected_data_mart_table_guids();
        let selected_data_mart_version_ids = $('#jstree-block').jstree(true).settings.tools.selected_data_mart_version_ids();
        if (selected_tables.length == 0 || selected_data_mart_version_ids.length == 0 ) { return []};

        let options = $('#jstree-block').jstree(true).settings.tools.all_nodes_by_kind('table');

        return options.filter(
            node => (
                !selected_tables.includes(node.data.guid) && selected_data_mart_version_ids.includes(node.data.data_mart_version_id) )
        ).map(
            node =>`<option value="${node.data.guid}" data-table-tech-name="${node.data.table_tech_name}">${node.data.name} (${node.data.table_tech_name})</option>`
        );
      },
      load_table_children(table_guid){
        let reference_table_node = $('#jstree-block').jstree(true).settings.tools.all_nodes_by_kind('table').filter( node => ( node.data.guid == table_guid))
        if (reference_table_node.length > 0 ){
          $('#jstree-block').jstree('load_node', reference_table_node[0]);
        }
      },
      selected_attribute_all_table_attributes_as_options() {
        let selected_attribute_guids = $('#jstree-block').jstree(true).settings.tools.selected_data_attribute_guids();
        let attribute_data = $('#jstree-block').jstree(true).settings.tools.all_nodes_by_kind('attribute')
        let options = attribute_data.filter(node => (selected_attribute_guids.includes(node.data.guid))).map(
            node =>`<option value="${node.data.guid}"
data-attribute-tech-name="${node.data.tech_name}"
data-table-tech-name="${node.data.table_tech_name}"> ${node.data.name} (${node.data.tech_name})</option>`
        )
        return $.unique(options)
      },
      all_data_attributes_for_table_guid_as_options(table_guid){
        let tree_attributes = $('#jstree-block').jstree(true).settings.tools.all_nodes_by_kind('attribute');
        tree_attributes = tree_attributes.filter( node => (node.data.data_mart_table_guid == table_guid)).map(
            node =>`<option value="${node.data.guid}"
 data-attribute-tech-name="${node.data.tech_name}"
 data-table-tech-name="${node.data.table_tech_name}"> ${node.data.name} (${node.data.tech_name})</option>`
        );

        return $.unique(tree_attributes)
      },
      all_nodes_by_kind(kind) {
        return $('#jstree-block').jstree('get_json', null, { 'flat': true }).filter(node => (node.data.kind == kind))
      },
    }
  })
    .on('deselect_node.jstree', function (_tree, e) {
      let selected_ids = jstree_selected_origin_ids();
      $(jstree_current_ids).not(selected_ids).get().forEach(jstree_element_off);
      jstree_current_ids = selected_ids;

      jstree_assign_multiple_input_val(selected_ids);
      jstree_multiversion_controll();
      $(this).jstree().settings.tools.trigger_change_ids();

      $('#jstree-block').jstree().deselect_node(jstree_related_ids(e.node));
    })
    .on('select_node.jstree', function (_tree, e) {
      $('#jstree-block').jstree('load_all', e.node);
      $('#jstree-block').jstree().redraw();

      $('#jstree-block').jstree().check_node(jstree_related_ids(e.node));
    })
    .on('load_all.jstree', function(_tree, e) {
      let selected_ids = jstree_selected_origin_ids();
      $(selected_ids).not(jstree_current_ids).get().forEach(jstree_element_on);
      jstree_current_ids = selected_ids;

      jstree_assign_multiple_input_val(selected_ids);
      jstree_multiversion_controll();
    })
    .on('ready.jstree', function(_tree, e) {
      let reopen = true;

      if ($('#jstree-block').data('native-open') == 'once') {
        reopen = false;
        $('#jstree-block').data('native-open', null);
      }

      if (reopen) {
        $(this).jstree().close_all();
        $(this).jstree().open_node($('li[aria-level="1"]').toArray());
      }
      let selected_ids = jstree_selected_origin_ids();
      $(selected_ids).not(jstree_current_ids).get().forEach(jstree_element_on);
      jstree_current_ids = selected_ids;

      jstree_assign_multiple_input_val(selected_ids);
      jstree_multiversion_controll();
    })
    .on('redraw.jstree', function(_tree, e) {
      jstree_redraw_actualize_fields();
      $(this).jstree().settings.tools.trigger_change_ids();
    })
  ;

  let to = false;
  $('#jstree-search').keyup(function () {
    if (to) {
      clearTimeout(to);
    }
    to = setTimeout(function () {
      let v = $('#jstree-search').val();
      // console.log(v);
      $('#jstree-block').jstree(true).search(v);
    }, 250);
  });
  $('[data-toggle="cropper-example-tooltip"]').tooltip({container: 'body'});
  // Popovers

  if ($('html').attr('dir') === 'rtl') {
    $('.popover-demo [data-placement=right]').attr('data-placement', 'left').addClass('rtled');
    $('.popover-demo [data-placement=left]:not(.rtled)').attr('data-placement', 'right').addClass('rtled');
  }

  // stick sidebox
  setTimeout(function () {
    $("#fix-to-top").stick_in_parent({
      offset_top: 20,
    });
  }, 50);

  $(document).on('click', '.jstree_plugin_card_close', function (e) {
    let li = $(e.target).parent().parent();
    let id = Number(li.attr('data-id'));

    jstree_imitation_off(id);
  });

  $(document).on('click', '.jstree_plugin_card_restore', function (e) {
    let li = $(e.target).parent().parent();
    let id = Number(li.attr('data-id'));
    jstree_imitation_on(id);
  });

  $('.jstree_btn_reset').click( function() {
    $(jstree_origin_ids).not(jstree_current_ids).get().forEach(jstree_imitation_on);
    $(jstree_current_ids).not(jstree_origin_ids).get().forEach(jstree_imitation_off);
    jstree_current_ids = jstree_origin_ids;
  });

  if ($('#conceptual_model_version_tree_export').length) {
    initTreeExport();
  }

  // 2. основная логика дерева

  function jstree_imitation_off(id) {
    if ($("#jstree-block").jstree().get_node(id)) {
      $("#jstree-block").jstree().uncheck_node(id);
    } else if ( jstree_nodes_by_original_id(id).length > 0 ) {
      $("#jstree-block").jstree().uncheck_node( jstree_base_ids(id) );
    } else {
      jstree_element_off(id);
    }
  }

  function jstree_element_off(id) {
    jstree_input_remove(id);

    if ( typeof jstree_origin_ids != 'undefined') {
      if (jstree_origin_ids.includes(id)) {
        jstree_origin_card_off(id)
      } else {
        jstree_new_card_remove(id)
      }
    }
    jstree_card_no_one_refresh();
  }

  function jstree_input_remove(id) {
    let leaf_id = jstree_leaf_id(id);
    $(`div#${leaf_id}`).remove();
  }

  function jstree_origin_card_off(id, trigger = true) {
    let card_id = jstree_card_id(id);
    if ($(`li#${card_id}`).hasClass('alert-danger')) return;

    $(`li#${card_id}`).addClass('alert-danger');
    $(`li#${card_id} a.jstree_plugin_card_cross`)
      .removeClass('jstree_plugin_card_close')
      .addClass('jstree_plugin_card_restore')
      .html('+');

    if (trigger) $('.jstree_plugin_card_restore').trigger('change');
  }

  function jstree_new_card_remove(id) {
    let card_id = jstree_card_id(id);
    $(`li#${card_id}`).remove();
  }


  function jstree_imitation_on(id) {
    if ($("#jstree-block").jstree().get_node(id)) {
      $("#jstree-block").jstree().check_node(id);
    } else if ( jstree_nodes_by_original_id(id).length > 0 ) {
      $("#jstree-block").jstree().check_node( jstree_base_ids(id) );
    } else {
      jstree_element_on(id);
    }
  }

  function jstree_element_on(id) {
    jstree_input_add(id);

    if ( typeof jstree_origin_ids != 'undefined') {
      if (jstree_origin_ids.includes(id)) {
        jstree_origin_card_on(id)
      } else {
        jstree_new_card_add(id)
      }
    }
    jstree_card_no_one_refresh();
  }

  function jstree_input_add(id) {
    let leaf_id = jstree_leaf_id(id);
    if ($(`div#${leaf_id}`).length > 0) return;

    $('div.jstree_container_template div.jstree_template_id').attr('id', leaf_id);
    $('div.jstree_container_ids').append($('div.jstree_container_template').html());
    $('div.jstree_container_template div.jstree_template_id').attr('id', null);

    $(`div#${leaf_id} input`).val(id).attr('id', function(i, val) { return val + id; } );
  }

  function jstree_origin_card_on(id, trigger = true) {
    let card_id = jstree_card_id(id);
    if ( !$(`li#${card_id}`).hasClass('alert-danger')) return;

    $(`li#${card_id}`).removeClass('alert-danger');
    $(`li#${card_id} a.jstree_plugin_card_cross`)
      .addClass('jstree_plugin_card_close')
      .removeClass('jstree_plugin_card_restore')
      .html('×');
    if (trigger) $('.jstree_plugin_card_close').trigger('change');
  }

  function jstree_new_card_add(id) {
    let card_id = jstree_card_id(id);
    let base_id = jstree_base_id(id);

    let list_title = $(`li#${base_id}.jstree-leaf a.jstree-anchor`).html();
    if (!list_title) list_title = $('#jstree-block').jstree().get_node(base_id).text

    if (!list_title) { return; }

    $('ul.jstree_container_template_card li.jstree_template_card').attr('id', card_id);

    $('ul.jstree_container_cards').prepend($('ul.jstree_container_template_card').html());
    $('.jstree_plugin_card_close').trigger('change');

    $('ul.jstree_container_template_card li.jstree_template_card').attr('id', '');

    $(`li#${card_id}`).attr('data-id', id);
    $(`li#${card_id} a.list_title`).html(list_title);
    $(`li#${card_id} a.list_title i.jstree-icon`).remove();
    let list_details = $(`li#${card_id} a.list_title span.list_details`).html();
    let a_href = $(`li#${card_id} a.list_title span.list_details`).attr('data-href');
    $(`li#${card_id} a.list_title span.list_details`).remove();
    $(`li#${card_id} div.media-body`).append(list_details);
    $(`li#${card_id} a.list_title`).attr('href', a_href);
  }


  function jstree_card_no_one_refresh() {
    if ( $('ul.jstree_container_cards li').length > 0 ) {
      $('div.jstree_card_no_one').addClass('d-none');
    } else {
      $('div.jstree_card_no_one').removeClass('d-none');
    }
  }


  function jstree_redraw_actualize_fields() {
    // 1. переменную в js
    let selected_ids = jstree_selected_origin_ids();
    // jstree_current_ids = selected_ids;
    // надо бы это сохранить, но тогда новые карточки справа не появляются.

    // 2. карточки справа в виджете
    //   убрать все "новые", которые не были выбраны
    $('ul.jstree_container_cards li.jstree_template_card').each(function () {
      if ( $.inArray($(this).data('id'), selected_ids) < 0 ) $(this).remove();
    })
    //   актуализировать статус существующих карточек
    $('ul.jstree_container_cards li.jstree_card').each(function () {
      let id = $(this).data('id');
      if ( $.inArray(id, selected_ids) < 0 ) {
        jstree_origin_card_off(id, false);
      } else {
        jstree_origin_card_on(id, false);
      }
    });

    // 3. инпуты для передачи данных
    //   убрать все
    $('div.jstree_container_ids div[id]').remove();
    //   добавить из jstree_current_ids
    $(selected_ids).get().forEach(jstree_input_add);
  }

  function jstree_assign_multiple_input_val(selected_ids) {
    let multiple_input = $('#jstree-block').closest('.tree_block_container').find('.jstree-multiple-input');
    multiple_input.val(selected_ids)
    multiple_input.trigger('change');
  }

  function jstree_multiversion_controll() {
    // проверка на мультиверсию, только если чекбокс есть и выбран
    if ( ($('#use_multi_version').length == 0) || (!$('#use_multi_version')[0].checked) ) {
      return;
    }

    // собираем список выбранных версий витрин данных
    let data_marts = {};
    let is_double_data_marts = false;
    $.each(jstree_selected_origin_ids(), function (i, id) {
      let node_data = $('#jstree-block').jstree(true).get_node(id).data;
      if (!(node_data.data_mart_id in data_marts)) {
        data_marts[node_data.data_mart_id] = []
      }
      if ( $.inArray( node_data.data_mart_version_code, data_marts[node_data.data_mart_id]) < 0 ) {
        data_marts[node_data.data_mart_id].push(node_data.data_mart_version_code);
      }
      if ( data_marts[node_data.data_mart_id].length > 1 ) {
        // если будем отображать ошибку о том, что выбрано несколько версий одной витрины
        is_double_data_marts = true;
      }
    });

    // организацию блокируем, что-бы через неё не выбрать более одной версии (как все дочерние в дереве)
    // блокируем все версии витрин данных, кроме выбранных
    $('#jstree-block').jstree('get_json', null, { 'flat': true }).forEach(function(e) {
      if ((e.data.kind == 'organization') ||
          (e.data.data_mart_id in data_marts) && ($.inArray( e.data.data_mart_version_code, data_marts[e.data.data_mart_id]) < 0))  {
        $('#jstree-block').jstree(true).disable_node(e.id);
      } else {
        $('#jstree-block').jstree(true).enable_node(e.id);
      }
    })
  }

  // 3. вспомогательные функции для обработки элементов дерева

  function jstree_selected_origin_ids() {

    let origin_ids = $('#jstree-block').jstree('get_selected', true)
      .filter(node => ( $('#jstree-block').data('select-type') !== 'element' ) || (node.children.length <= 0))
      .map(node => node.li_attr.original_id || node.id)
      .map(Number)
      .filter(Number);
// @todo проверить что unique работает для массива
    return $.unique( origin_ids );
  }

  function jstree_related_ids(node) {
    let original_ids = $.merge( [node.id], node.children_d )
      .map(i => $('#jstree-block').jstree('get_node', i).li_attr.original_id )
      .filter(i => i)

    return $('#jstree-block').jstree('get_json', null, { 'flat': true })
      .filter(node => original_ids.includes(node.li_attr.original_id)).map(node => node.id)
  }

  function jstree_leaf_id(id) {
    return `jstree_leaf_id_${id}`;
  }

  function jstree_card_id(id) {
    return `jstree_card_id_${id}`;
  }

  // "базовый" id-шник, может быть составным в случае нахождения атрибута внутри группы groupId_attrId
  function jstree_base_id(id) {
    return jstree_base_ids(id)[0];
  }

  function jstree_base_ids(id) {
    if ( $('#jstree-block').jstree(true).get_node(id) ) {
      return [id];
    }

    return jstree_nodes_by_original_id(id).map(node => node.id).sort((a, b) => a - b)
  }

  function jstree_nodes_by_original_id(id) {
    return $('#jstree-block').jstree('get_json', null, { 'flat': true }).filter(node => (id == node.li_attr.original_id))
  }

});
