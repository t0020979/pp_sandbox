# frozen_string_literal: true

class Tree::BaseSerializer < Nsud::Essentials::ApplicationSerializer
  attributes :id,
             :text,
             :type,
             :state,
             :data_jstree,
             :original_id

  def id
    @_id ||= @object.id || SecureRandom.alphanumeric(6)
  end

  def text
    object_decorated.respond_to?(:jstree_text) ? object_decorated.jstree_text : ( @object.name || '')
  end

  def type
    'default'
  end

  def state
    @state ||= { opened: opened?, selected: selected?, disabled: disabled?, type: type }
  end

  def data_jstree
    state.to_json
  end

  def original_id
    @object.id
  end

  def opened?
    true
  end

  def selected?
    false
  end

  def disabled?
    false
  end
end
